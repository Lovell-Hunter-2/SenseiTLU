/**
 * SenseiTLU - Export Firestore Catalog to Static JSON
 * 
 * Run with: node scripts/exportCatalog.cjs
 * 
 * Fetches all subjects and documents from Firestore once and exports
 * them into public/data/catalog.json to enable Zero-Firestore-Read Mode.
 */

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy } = require('firebase/firestore');

// Load config
const configPath = path.join(__dirname, '..', 'firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ Could not find firebase-applet-config.json');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function exportCatalog() {
  console.log('🔄 Bắt đầu xuất danh mục dữ liệu Firestore sang file tĩnh...');
  console.log(`📡 Kết nối Firestore: ${config.projectId} (${config.firestoreDatabaseId || 'default'})...`);

  try {
    // 1. Fetch all subjects
    console.log('📦 Đang tải danh sách môn học...');
    const subjectsQuery = query(collection(db, 'subjects'), orderBy('name', 'asc'));
    const subjectsSnap = await getDocs(subjectsQuery);

    const subjects = subjectsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        iconName: data.iconName || 'Book',
        description: data.description || '',
        isPriority: Boolean(data.isPriority),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || null
      };
    });

    console.log(`✅ Đã tải ${subjects.length} môn học.`);

    // 2. Fetch all documents
    console.log('📑 Đang tải toàn bộ tài liệu học tập...');
    const docsSnap = await getDocs(collection(db, 'documents'));
    const documentsBySubject = {};

    let totalDocsCount = 0;
    docsSnap.docs.forEach(doc => {
      const data = doc.data();
      const subjectId = data.subjectId;
      if (!subjectId) return;

      if (!documentsBySubject[subjectId]) {
        documentsBySubject[subjectId] = [];
      }

      documentsBySubject[subjectId].push({
        id: doc.id,
        subjectId: data.subjectId,
        title: data.title || '',
        type: data.type || 'Khác',
        url: data.url || '',
        chapter: data.chapter || '',
        isHidden: Boolean(data.isHidden),
        isFolder: Boolean(data.isFolder),
        items: Array.isArray(data.items) ? data.items : [],
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || null
      });

      totalDocsCount++;
    });

    console.log(`✅ Đã tải ${totalDocsCount} tài liệu chia theo ${Object.keys(documentsBySubject).length} môn.`);

    // 3. Build catalog object
    const catalog = {
      lastUpdated: new Date().toISOString(),
      version: 1,
      totalSubjects: subjects.length,
      totalDocuments: totalDocsCount,
      subjects,
      documents: documentsBySubject
    };

    // 4. Write to public/data/catalog.json
    const outputDir = path.join(__dirname, '..', 'public', 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'catalog.json');
    fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2), 'utf8');

    console.log(`🎉 XUẤT FILE THÀNH CÔNG!`);
    console.log(`📁 File lưu tại: ${outputPath}`);
    console.log(`📊 Tổng kết: ${subjects.length} môn học, ${totalDocsCount} tài liệu.`);
    console.log(`🚀 Website hiện đã sẵn sàng phục vụ sinh viên với 0 lượt đọc Firestore!`);

    process.exit(0);
  } catch (err) {
    if (err.code === 'resource-exhausted' || err.message?.includes('Quota')) {
      console.error('⚠️ LỖI: Hạn ngạch Firestore (Quota) hiện đang bị vượt mức.');
      console.error('👉 Vui lòng chờ đến 14:00 (khi Google reset quota) và chạy lại lệnh này!');
    } else {
      console.error('❌ Lỗi xuất dữ liệu:', err);
    }
    process.exit(1);
  }
}

exportCatalog();
