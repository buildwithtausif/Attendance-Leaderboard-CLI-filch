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
function selectClass(cls) {
  // load data
  const data = loadData();
  if (!data || !data.classes[cls]) {
    console.log("Specified Class does not exists or the database is empty!");
    console.log("use: filch create class <classNameSection>");
    process.exit(1);
  }
  // insert currentClass into data.config.currentClass
  try {
    data.config.currentClass = cls;
    saveData(data);
    console.log(`Working on class: ${data.config.currentClass}`);
  } catch (err) {
    console.log(`Filch has encountered an error while selecting class ${err}`);
    process.exit(1);
  }
  process.exit(0);
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
function markAttendance(customDate) {
  const data = loadData();
  const cls = data.config.currentClass;
  const classObj = data.classes[cls];
  console.log(`classObject: `, classObj);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // in js is 0 indexed
  const day = now.getDate();
  const crrDate = `${year}-${month}-${day}`;
  const dateRegEx = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  let dateKey = (customDate) ? customDate : crrDate;
  if (!dateRegEx.test(dateKey)) {
    console.log("invalid date provided, use YYYY-MM-DD format");
    process.exit(1);
  }
  console.log(`length of classObj: `, classObj.students.length);
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
}
/*
  one edge case identified is
  what if a new student is added and the teacher marks attendance for
  a date say 28-10-2025 and for this date roll number 1,2 already marked then the only left is
  new student, therefore to prevent overpush we need to only push this data to the student whose 
  attendance is not marked for this day

  edge case cleared 
*/