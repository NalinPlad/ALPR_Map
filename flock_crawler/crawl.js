import { parse } from 'node-html-parser';

// https://transparency.flocksafety.com/flock-safety-admins
// https://transparency.flocksafety.com/flock-safety-le-training
// https://transparency.flocksafety.com/florida-le-flock-training

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


const response = await fetch("https://transparency.flocksafety.com/flock-safety-admins");
const text = await response.text();

const DOM = parse(text);


list_depts(DOM).forEach(dept => {
    // console.log(dept + " " + gen_slug(dept))
    test_URL(gen_slug(dept))
})



// const Assoc_Depts = DOM.querySelector("#usage > div:nth-child(4) > div > div.pl-0.col-10 > div:nth-child(2) > div").innerText.split(", ")
// // console.log(text)
// Assoc_Depts.forEach(dept => {
//     console.log(dept)
// });


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

async function test_URL(slug){
    const url = "https://transparency.flocksafety.com/" + slug
    const response = await fetch(url);
    if(response.status == 200) {
        console.log("Found " + url)
    }
}

// console.log(Assoc_Depts);