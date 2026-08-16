import { v1 } from "@google-cloud/firestore";
const client = new v1.FirestoreAdminClient({
  projectId: "gen-lang-client-0664343819"
});
async function list() {
  try {
    const [dbs] = await client.listDatabases({ parent: "projects/gen-lang-client-0664343819" });
    console.log("Databases:", dbs.map(db => db.name));
  } catch(e) {
    console.error(e);
  }
}
list();
