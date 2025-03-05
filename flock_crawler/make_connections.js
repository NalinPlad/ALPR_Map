import { DatabaseSync } from 'node:sqlite';
import { parse } from 'node-html-parser';

const database = new DatabaseSync('../WWW/public/audit_db');

const getActiveDepartments = database.prepare(`
    SELECT dept_slug, name FROM departments WHERE flock_status = 200
`);

const createConnection = database.prepare(`
    INSERT INTO connections (connection_id, dept_a, dept_b)
    VALUES (?, ?, ?)
`);

const getConnectionIds = database.prepare(`
    SELECT connection_id FROM connections
`);

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

const active_departments = getActiveDepartments.all()
const cached_connections = getConnectionIds.all()

const active_names = active_departments.map(d => d.name)
const cached_connection_ids = cached_connections.map(d => d.connection_id)

for(const department of active_departments){
    const url = "https://transparency.flocksafety.com/" + department.dept_slug

    const response = await fetch(url);

    if(response.status != 200){
        console.log("Error",department.dept_slug,response.status)
        continue
    }

    const text = await response.text();
    const DOM = parse(text);

    const depts = list_depts(DOM)

    let known = []

    depts.forEach(dept => {
        const x = (department.name + ":" + dept).replaceAll(" ", "");
        if(!cached_connection_ids.includes(x) && active_names.includes(dept)) {
            createConnection.run(x, department.name, dept);
            known.push(dept)
        }
    })

    console.log(`${department.name} added ${known.length} connections`)

}