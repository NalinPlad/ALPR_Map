import { parse } from 'node-html-parser';
import { DatabaseSync } from 'node:sqlite';



// ' Flock City PD - Law Enforcement Sales Demo',
// ' Flock LE Training - Old',
// ' Flock PD',
// ' Flock Safety - Admins',
// ' Flock Safety - Commercial Sales Demo',
// ' Flock Safety - Customer',
// ' Flock Safety - Engineering',
// ' Flock Safety - Marketing',
// ' Flock Safety - Ops',
// ' Flock Safety - Sales',
// ' Flock Safety HOA - External Testing',
// ' Flock Safety LE Training',
// ' Flock Safety PD - External Testing',
// ' Flock Safety PD Test Org',
// ' Florida LE Flock Training',

let found = []
let failed = []

const database = new DatabaseSync('./audit_db');

const initDatabase = `
CREATE TABLE IF NOT EXISTS departments (
  dept_slug TEXT PRIMARY KEY,
  flock_status INTEGER NOT NULL,
  name TEXT NOT NULL UNIQUE,
  last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  camera_count INTEGER
);

CREATE TABLE IF NOT EXISTS searches (
  search_dept TEXT NOT NULL,
  search_id TEXT PRIMARY KEY, 
  user_id TEXT NOT NULL,
  time DATETIME NOT NULL,
  camera_count INTEGER,
  reason TEXT,

  FOREIGN KEY (search_dept) REFERENCES departments (dept_slug)
);
`;

database.exec(initDatabase);





const createDepartment = database.prepare(`
    INSERT INTO departments (dept_slug, flock_status, name, camera_count)
    VALUES (?, ?, ?, ?)
    RETURNING last_updated
`);

const getDepartments = database.prepare(`
    SELECT dept_slug FROM departments
`);




let cache_depts = []



const response = await fetch("https://transparency.flocksafety.com/el-cerrito-ca-pd");
const text = await response.text();

const DOM = parse(text);


const depts = list_depts(DOM);
console.log(`Searching ${depts.length} depts...`)
depts.forEach(dept => {
    // console.log(dept + " " + gen_slug(dept))
    process_dept(dept)
})

function gen_slug(dept) {
    return dept.replaceAll(" - ", " ").replaceAll(" ", "-")
}

function list_depts(DOM) {
    // console.log(1)
    const labels = DOM.querySelectorAll(".label.col-12");
    // console.log(labels)
    let depts = []
    labels.forEach(label => {
        if(label.innerText == "External organizations with access") {
            depts = label.parentNode.nextSibling.firstChild.innerText.split(", ")
        }
    });

    return depts
}

function get_num_searches(DOM) {
    // console.log(1)
    const labels = DOM.querySelectorAll(".label.col-12");
    // console.log(labels)
    let num = null
    labels.forEach(label => {
        if(label.innerText == "Searches in the last 30 days") {
            num = label.parentNode.nextSibling.firstChild.innerText
        }
    });

    return num
}

function get_audit(DOM) {
    // console.log(1)
    const labels = DOM.querySelectorAll(".label.col-12");
    // console.log(labels)
    let csv = null
    labels.forEach(label => {
        if(label.innerText == "Public Search Audit") {
            csv = label.parentNode.nextSibling.firstChild.firstChild.href;
        }
    });

    return csv
}

async function process_dept(name){
    // if(found.includes(slug) || failed.includes(slug)) {
    //     return
    // }

    const slug = gen_slug(name)


    const url = "https://transparency.flocksafety.com/" + slug

    const response = await fetch(url);
    if(response.status == 200) {
        const text = await response.text();
        const DOM = parse(text)
        found.push(slug)
        // console.log(`Found ${slug}, ${get_num_searches(DOM)} searches, ${get_audit != null ? "✅" : "no audit"} ${url}`)
    } else {
        failed.push(slug)
    }

    const newDept = createDepartment.get(slug, response.status, name, 0)
}

// console.log(Assoc_Depts);