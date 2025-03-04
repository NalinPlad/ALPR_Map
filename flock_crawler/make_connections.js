import { DatabaseSync } from 'node:sqlite';
import { parse } from 'node-html-parser';

const database = new DatabaseSync('../WWW/public/audit_db');

const getActiveDepartments = database.prepare(`
    SELECT dept_slug, name FROM departments WHERE flock_status = 200
`);

const getSearchIds = database.prepare(`
    SELECT search_id FROM searches
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

let active_departments = getActiveDepartments.all()

const active_names = active_departments.map(d => d.name)

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
        if(active_names.includes(dept)) {
            known.push(dept)
        }
    })

    console.log(`${department.name} has ${known.length} known connections`)

}