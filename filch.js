#!/usr/bin/env node
// that line above is called 'shebang' or 'hashbang' tells OS to not run it simply as shell script use a different interpreter at that address

// we'll need to store dictionary for that we need filsystem and path modules inside our project
const fs = require("node:fs");
const path = require("node:path");
const { argv } = require("node:process"); // read command line arguments
const readline = require("node:readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// task1 is specify path for db.json
/*
    { 
        "classes": { 
            "10-A": { "students": [...] }, 
            "10-B": { "students": [...] } 
	    } 
    }
*/
const DEFAULT_DATA_SCHEME = {
  config: {
    currentClass: null
  },
  classes: {},
};

const DB_PATH = path.join(__dirname, "data", "db.json"); // path to attendance database, "absolute-path"
// first step is to load the json into runtime
function loadData() {
  try {
    // if file exist at the specified address, this prevents if the db.json exist but is empty then write into it with default data scheme
    if (
      fs.existsSync(DB_PATH) &&
      fs.readFileSync(DB_PATH, "utf-8").length > 0
    ) {
      const data = fs.readFileSync(DB_PATH);
      return JSON.parse(data);
    }
    // if the file at specified address doesn't exist return a new json-object
    return DEFAULT_DATA_SCHEME;
  } catch (err) {
    console.log(`Error while loading data: ${err}`);
    process.exit(1);
  }
}
// save data function
function saveData(data) {
  try {
    if (!data) {
      console.log("Empty data can't be written");
    }
    // check if data folder exists if not create one
    if (!fs.existsSync(DB_PATH)) {
      fs.mkdirSync(DB_PATH, { recursive: true });
    }
    // write a structured json file
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    console.log("Data saved!");
  } catch (err) {
    console.log(`Error while loading data: ${err}`);
    process.exit(1);
  }
}
// the data is loaded in memory

// now with the loaded data first create a class like "8-B"
function createClass() {
  // load the data in memory and insert class name into it
  const data = loadData();
  try {
    // read <classSection> from user
    rl.question("Please enter <classNameSection>: ", (ans) => {
      if (!ans) {
        console.log("Provide a Class and Section name.");
        return createClass(); // call recursively
      }
      if (data.classes[ans]) {
        console.log(`Error: Provided ${ans} already exists`);
        return createClass(); // call recursively
      }
      data.classes[ans] = {
        students: [],
      };
      saveData(data);
      console.log(`${ans} is created`);
      rl.close(); // close readline
    });
  } catch (err) {
    console.log(
      `Filch has encountered an error while trying to make a class: ${err}`
    );
    process.exit(1);
  }
}
// select a class before calling insert, leaderboard or mark function
function selectClass() {
  // load data
  const data = loadData();
  if (!data || data.classes.length === 0) {
    console.log("Error loading class database");
    console.log("use: filch create class <classNameSection>");
    process.exit(1);
  }
  rl.question(`Please select a class [${Object.keys(data.classes)}]: `, (ans) => {
      // insert currentClass into data.config.currentClass
  if (ans) {
    try {
      data.config.currentClass = ans;
      saveData(data);
      console.log(`Working on class: ${data.config.currentClass}`);
      console.log(`
            --- to insert student: filch insert students
            --- to mark attendance: filch mark attendance
            --- to view leaderboard: filch view leaderboard
        `)
      process.exit(0);
    } catch (err) {
      console.log(`Filch has encountered an error while selecting class ${err}`);
      process.exit(1);
    }
  }
  });
}
// after creating a class, insert students into it with roll numbers [{roll: , name: , attendance: {date: p/a}]
function insertStudents() {
  // load data-scheme to memory
  const data = loadData();
  // get the class on which we have to work
  const cls =
    data.config.currentClass !== null
      ? data.config.currentClass
      : console.log("You've not selected any class!"); // note: this should come from config object
  // get the class object for it
  const classObj = data.classes[cls];
  console.log(classObj);
  if (!cls) {
    console.log(`${cls} does not exists`);
    process.exit(1);
  }
  try {
    rl.question("Please enter roll number of student: ", (roll) => {
      if (!roll) {
        console.log("Provide a valid roll number");
        return insertStudents(); // call recursively
      }
      rl.question(
        `Please enter name of student belongs to this roll number ${roll}: `,
        (name) => {
          if (!name) {
            console.log("Provide a valid name");
            return insertStudents(); // call recursively
          }
          // insert roll number, name and attendance object to students array in data>classes>students
          classObj.students.push({
            roll,
            name,
            attendance: [],
          });
          // call save data function to write into file
          saveData(data);
          console.log(`Student ${name} (roll ${roll}) added to ${cls}.`);
          // ask if need to add more students
          rl.question("Add another student? (y/n): ", (ans) => {
            if (ans.toLowerCase() === "y") insertStudents();
            else rl.close(); // in this it is not required to exit from the process as readline handles that close argument
          });
        }
      );
    });
  } catch (err) {
    console.log(
      `Filch has encountered an error while trying to insert students to class: ${err}`
    );
    process.exit(1);
  }
}
/*
  one edge case identified is
  what if a new student is added and the teacher marks attendance for
  a date say 28-10-2025 and for this date roll number 1,2 already marked then the only left is
  new student, therefore to prevent overpush we need to only push this data to the student whose 
  attendance is not marked for this day

  edge case cleared 
*/
function markAttendance() {
  const data = loadData();
  const cls = data.config.currentClass;
  const classObj = data.classes[cls];
  // console.log(`classObject: `, classObj);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // in js is 0 indexed
  const day = now.getDate();
  const crrDate = `${year}-${month}-${day}`;
  const dateRegEx = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  // ask user for date for current day default is y
  let dateKey = null;
  if (dateKey === null) {
    rl.question(`Please enter date for marking attendance [${crrDate}], type y for current date: `, (ans) => {
      if (ans.toLowerCase() === "y") {
        dateKey = crrDate;
      } else {
        dateKey = ans;
      }
      if (!dateRegEx.test(dateKey)) {
        console.log("invalid date provided, use YYYY-MM-DD format");
        process.exit(1);
      }
      // console.log(`length of classObj: `, classObj.students.length);
      let index = 0; // we'll use this to loop through students length
      function mark() {
        if (index < classObj.students.length) {
          let currentStudent = classObj.students[index];
          let isAlreadyMarked = classObj.students[index].attendance.some(entry => entry.date === dateKey);
          if (isAlreadyMarked) {
            console.log(`--- skipping ${currentStudent.name} (roll ${currentStudent.roll}) already marked for ${dateKey} as ${classObj.students[index].attendance[0].status} ---`);
            index++; // go to next student, and skip this student
            mark();
          } else {
            rl.question(`Mark attendance for ${classObj.students[index].name} Roll no: ${classObj.students[index].roll}: `, (ans) => {
              if (ans.toLowerCase() === "p") {
                classObj.students[index].attendance.push({
                  date:  dateKey,
                  status: "P"
                })
                index++; // increment the index 
                mark();  // call marks recutsively
              } else if (ans.toLowerCase() === "a") {
                classObj.students[index].attendance.push({
                  date: dateKey,
                  status: "A"
                });
                index++;
                mark(); // call marks recursively
              } else {
                console.log("Invalid input, use: P/A and try again.");
                mark(); // call mark recursively
              }
            });
          }
        } else {
          saveData(data);
          console.log(`Attedance marked successfully`);
          rl.close();
        }
      }
      mark();
    });
  }
}
// calculate leaderboard
/*
  objective: after 5 days of attendance mark,
  calculate attedance percentage, then show top3 students
*/
function calculateLeaderboard() {
  const data = loadData();
  // to calculate leaderboard we need to select a class first
  const cls = (data.config.currentClass !== null) ? data.config.currentClass : console.log("You've not selected any class!");
  const classObj = data.classes[cls];
  if (!cls) {
    console.log(`${cls} does not exists`);
    process.exit(1);
  }
  // console.log(classObj);
  // now we need to filter out each attendance where status is present withing 5 day range?
  // which range? from today or a specific date range?
  // two cases 1. last 5 days 2. specific date range
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // in js is 0 indexed
  const day = now.getDate();
  const crrDate = `${year}-${month}-${day}`;
  // first calculate leaders for last 5 days from now
  const last5Days = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // in js is 0 indexed
    const day = date.getDate();
    const dateKey = `${year}-${month}-${day}`;
    last5Days.push(dateKey);
  }
  // console.log(last5Days);
  // filter names 
  let names = [];
  let attendance = [];
  classObj.students.forEach(student => {
    let count = 0;
    student.attendance.forEach(entry => {
      if (last5Days.includes(entry.date) && entry.status === "P") {
        count++;
      }
    });
    names.push(student.name);
    attendance.push(count);
  });
  // console.log(names);
  // console.log(attendance);
  // calculate attendance percentage
  let percentage = [];
  attendance.forEach(count => {
    percentage.push((count / 5) * 100);
  });
  // we need to map percentage with names in such a way to only get 3 name arrays with %
  let leaderBoard = [];
  for (let i = 0; i < 3; i++) {
    let max = 0;
    let maxIndex = 0;
    for (let j = 0; j < percentage.length; j++) {
      if (percentage[j] > max) {
        max = percentage[j];
        maxIndex = j;
      }
    }
    leaderBoard.push({
      name: names[maxIndex],
      percentage: max
    });
    names.splice(maxIndex, 1);
    percentage.splice(maxIndex, 1);
  }
  // printing leaders
  console.log(`
    ------- LEADER'S OF THE WEEK -------
    ${leaderBoard[0].name} - ${leaderBoard[0].percentage}%
    ${leaderBoard[1].name} - ${leaderBoard[1].percentage}%
    ${leaderBoard[2].name} - ${leaderBoard[2].percentage}%
    `);
}

// now before calculating leaderboard need to implement cmd commands
function main() {
  // create commands arguments
  const cmd = [argv[2], argv[3], argv[1]];
  switch (true) {
    case (cmd[0] === "create" && cmd[1] === "class"):
                  createClass();
                  break;
    case (cmd[0] === "select" && cmd[1] === "class"):
                  selectClass();
                  break;
    case (cmd[0] === "insert" && cmd[1] === "students"):
                  insertStudents();
                  break;
    case (cmd[0] === "mark" && cmd[1] === "att"):
                  markAttendance();
                  break;
    case (cmd[0] === "view" && cmd[1] === "leaders"): 
                  calculateLeaderboard();
                  break;
    default: 
            console.log("Invalid command");
            process.exit(1);
  }
}
main();