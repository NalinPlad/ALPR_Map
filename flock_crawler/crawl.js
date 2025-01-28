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


const database = new DatabaseSync('./audit_db');

const initDatabase = `
CREATE TABLE IF NOT EXISTS departments (
  dept_slug TEXT PRIMARY KEY,
  flock_status INTEGER NOT NULL,
  name TEXT NOT NULL UNIQUE,
  -- Unix Timestamp
  last_updated INTEGER NOT NULL,
  camera_count INTEGER,
  vehicles_30_days INTEGER,
  searches_30_days INTEGER
);

CREATE TABLE IF NOT EXISTS searches (
  search_dept TEXT NOT NULL,
  search_id TEXT PRIMARY KEY, 
  user_id TEXT NOT NULL,
  time INTEGER NOT NULL,
  camera_count INTEGER,
  reason TEXT,

  FOREIGN KEY (search_dept) REFERENCES departments (dept_slug)
);
`;

// database.exec("DROP TABLE IF EXISTS searches")
// database.exec("DROP TABLE IF EXISTS departments")
database.exec(initDatabase);





const createDepartment = database.prepare(`
    INSERT INTO departments (dept_slug, flock_status, name, last_updated, camera_count, vehicles_30_days, searches_30_days)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING dept_slug, flock_status, last_updated
`);

const getDepartments = database.prepare(`
    SELECT dept_slug, flock_status, last_updated FROM departments
`);

const getSearchIds = database.prepare(`
    SELECT search_id FROM searches
`);

const createSearch = database.prepare(`
    INSERT INTO searches (search_dept, search_id, user_id, time, camera_count, reason)
    VALUES (?, ?, ?, ?, ?, ?)
`);




let cache_depts = getDepartments.all()
let search_ids = getSearchIds.all().map(i => i.search_id)



// console.log(search_ids);

// process.exit()



const response = await fetch("https://transparency.flocksafety.com/el-cerrito-ca-pd");
const text = await response.text();

const DOM = parse(text);


const depts = list_depts(DOM);
// console.log(depts)
// const depts = [
//   'Anaheim CA PD',
//   'Anderson CA PD',
//   'Antioch CA PD',
//   'Arcadia CA PD',
//   'Atherton CA PD',
//   'Atwater CA PD',
//   'Auburn CA PD',
//   'Azusa CA PD',
//   'Bakersfield CA PD',
//   'Baldwin Park CA PD',
//   'Beaumont CA PD',
//   'El Cerrito CA PD',
//   'Bell Gardens CA PD'
// ]

// const audit = get_audit(DOM);
// const searches = process_audit(audit)





// process.exit()

console.log(`Searching ${depts.length} depts...`)

for (const dept of depts) {
    await process_dept(dept);
}

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

    return (num == null || isNaN(num.replaceAll(",", ""))) ? null : parseInt(num.replaceAll(",", ""))
}

function get_num_cameras(DOM) {
    // console.log(1)
    const labels = DOM.querySelectorAll(".label.col-12");
    // console.log(labels)
    let num = null
    labels.forEach(label => {
        if(label.innerText == "Number of owned cameras") {
            num = label.parentNode.nextSibling.firstChild.innerText
        }
    });

    return (num == null || isNaN(num.replaceAll(",", ""))) ? null : parseInt(num.replaceAll(",", ""))
}

function get_num_vehicles_30_days(DOM) {
    // console.log(1)
    const labels = DOM.querySelectorAll(".label.col-12");
    // console.log(labels)
    let num = null
    labels.forEach(label => {
        if(label.innerText == "Vehicles detected in the last 30 days") {
            num = label.parentNode.nextSibling.firstChild.innerText
        }
    });

    return (num == null || isNaN(num.replaceAll(",", ""))) ? null : parseInt(num.replaceAll(",", ""))
}


function get_num_searches_30_days(DOM) {
    // console.log(1)
    const labels = DOM.querySelectorAll(".label.col-12");
    // console.log(labels)
    let num = null
    labels.forEach(label => {
        // console.log(label.innerText)
        if(label.innerText == "Searches in the last 30 days") {
            num = label.parentNode.nextSibling.firstChild.innerText
        }
    });

    return (num == null || isNaN(num.replaceAll(",", ""))) ? null : parseInt(num.replaceAll(",", ""))
}


function get_audit(DOM) {
    // console.log(1)
    const labels = DOM.querySelectorAll(".label.col-12");
    let csv = null
    labels.forEach(label => {
        if(label.innerText == "Public Search Audit") {
            // console.log(label.parentNode.nextSibling.firstChild.firstChild._attrs)
            if(label.parentNode.nextSibling.firstChild.firstChild._attrs){
                csv = label.parentNode.nextSibling.firstChild.firstChild._attrs.href;
            }
        }
    });

    return csv
}

function process_audit(csv) {
    const records = []
    const lines = decodeURIComponent(csv.replaceAll("data:text/plain;charset=utf-8,", "")).split("\n");
    lines.shift();
    
    lines.forEach(line => {
        let seg = line.split(",")
        let ms = new Date(seg[2].slice(1,-1))
        records.push(
            {
                "id": seg[0].slice(1,-1),
                "u_id": seg[1].slice(1,-1),
                "time": ms.getTime(),
                "cam_count": parseInt(seg[3]),
                "reason": seg[4].slice(1,-1)
            }
        );

        // console.log(seg[4])
    });

    return records 
}

function search_batch_insert(searches, dept_slug){
    // database.exec("begin transaction");
    
    searches.forEach(search => {
        // console.log("Inserting: ",search.reason, search_ids.includes(search.id))
        if(search_ids.includes(search.id)){
            // console.log("DONE", dept_slug)
            return
        } else {
            createSearch.run(dept_slug, search.id, search.u_id, search.time, search.cam_count, search.reason)
            search_ids.push(search.id)
        }
    });
    
    // database.exec("commit");
}


async function process_dept(name){
    // console.log(name)
    // if(found.includes(slug) || failed.includes(slug)) {
    //     return
    // }
    const slug = gen_slug(name)

    if (cache_depts.some(e => e.dept_slug === slug)){
        // We have processed this dept before
        // console.log("processed already!!!!")
        return
    }



    const url = "https://transparency.flocksafety.com/" + slug
    // console.log(url)

    let num_cams = null
    let num_vehicles = null
    let num_searches = null

    const response = await fetch(url);
    if(response.status == 200) {
        const text = await response.text();
        const DOM = parse(text)
        num_cams = get_num_cameras(DOM);
        num_vehicles = get_num_vehicles_30_days(DOM);
        num_searches = get_num_searches_30_days(DOM);

        const newDept = createDepartment.get(slug, response.status, name, Date.now(), null, null, null)
        cache_depts.push(newDept);

        const audit = get_audit(DOM);

        if(audit != null) {
            // console.log("AUDITING ", slug)
            const searches = process_audit(audit);
            // console.log(audit.slice(0,1000))
            // console.log(searches[0])
            search_batch_insert(searches, slug)
        }

        console.log(`Found ${slug}, ${get_num_searches(DOM)} searches, ${num_cams} cameras, ${audit != null ? "✅ audit" : "❌ audit"} ${url}`)

        return
    } 
    // else {
    //     failed.push(slug)
    // }

    // console.log(slug, response.status, name, Date.now(), 0, cache_depts.some(e => e.dept_slug === slug))
    const newDept = createDepartment.get(slug, response.status, name, Date.now(), null, null, null)
    cache_depts.push(newDept);
}

// console.log(Assoc_Depts);