import { DatabaseSync } from 'node:sqlite';
import { parse } from 'node-html-parser';

const database = new DatabaseSync('./audit_db');

const getActiveDepartments = database.prepare(`
    SELECT dept_slug, name FROM departments WHERE flock_status = 200
`);

const getSearchIds = database.prepare(`
    SELECT search_id FROM searches
`);

const createSearch = database.prepare(`
    INSERT INTO searches (search_dept, search_id, user_id, time, camera_count, reason)
    VALUES (?, ?, ?, ?, ?, ?)
`);


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
    });

    return records 
}

let num_new_searches = 0

function search_batch_insert(searches, dept_slug){
    // database.exec("begin transaction");
    
    searches.forEach(search => {
        // console.log("Inserting: ",search.reason, search_ids.includes(search.id))
        if(search_ids.includes(search.id)){
            // console.log("DONE", dept_slug)
            return
        } else {
            try {
                createSearch.run(dept_slug, search.id, search.u_id, search.time, search.cam_count, search.reason)
                search_ids.push(search.id)

                num_new_searches += 1

            } catch (error) {
                console.log("! SQL failure inserting search; " + error,dept_slug,search.id,search.reason)
                search_ids.push(search.id)
            }
        }
    });
    
    // database.exec("commit");
}


function get_audit(DOM) {
    // console.log(1)
    const labels = DOM.querySelectorAll(".label.col-12");
    let csv = null
    labels.forEach(label => {
        if(label.innerText == "Public Search Audit") {
            if(label.parentNode.nextSibling.firstChild.firstChild._attrs){
                csv = label.parentNode.nextSibling.firstChild.firstChild._attrs.href;
            }
        }
    });

    return csv
}


let search_ids = getSearchIds.all().map(i => i.search_id)
let active_departments = getActiveDepartments.all()



for(const department of active_departments){
    const url = "https://transparency.flocksafety.com/" + department.dept_slug

    const response = await fetch(url);

    if(response.status != 200){
        console.log("Error",department.dept_slug,response.status)
        continue
    }

    const text = await response.text();
    const DOM = parse(text);

    const audit = get_audit(DOM);

    if(audit != null) {
        const seaches = process_audit(audit);
        search_batch_insert(seaches, department.dept_slug)
    }
}

console.log("Added " + num_new_searches + " new searches")