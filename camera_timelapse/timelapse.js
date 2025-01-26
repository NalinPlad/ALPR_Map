const url = "https://cwwp2.dot.ca.gov/data/d4/cctv/image/t257esr123centralavenuelookingeast/previous/t257esr123centralavenuelookingeast-"
//           https://cwwp2.dot.ca.gov/data/d4/cctv/image/t257nsr123centralavenuelookingnorth/previous/t257nsr123centralavenuelookingnorth-1.jpg
// const interval = 24 * 60 * 60 * 1000

// const num = 10

// console.log(Date.now)

// const start_time = Date.now();

for(var t = 1; t <= 12; t += 1){
    // console.log(url + t + ".jpg");
    const result = await fetch(url + t + ".jpg");
    const path = `./images/${t}.jpg`;
    await Bun.write(path, result);
}