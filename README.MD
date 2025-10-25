# Filch - Attendance Management CLI

![Node.js](https://img.shields.io/badge/Node.js-14.x%2B-green.svg)

Filch is a simple, command-line attendance management tool built with Node.js. It allows a user (like a teacher or administrator) to create classes, add students, mark daily attendance, and view an attendance-based leaderboard.

All data is stored locally in a `data/db.json` file, making it portable and easy to manage.

## Features

* **Create Classes:** Easily add new classes (e.g., "10-A", "History-101").
* **Select Class:** Set an "active" class to perform operations on.
* **Add Students:** Insert students into the active class with a roll number and name.
* **Mark Attendance:** Run an interactive prompt to mark students as Present ("P") or Absent ("A") for a given date.
    * Automatically detects and skips students who are already marked for that day.
    * Defaults to the current date but allows custom date entry (YYYY-MM-DD).
* **View Leaderboard:** Calculates and displays the top 3 students based on their attendance percentage over the last 5 days.
* **Local JSON Database:** All data is stored in a human-readable `db.json` file.

## Setup and Installation

1.  **Download:**
    Download or clone the `filch.js` file to your local machine.

2.  **Make Executable:**
    You need to make the script executable.
    ```bash
    chmod +x filch.js
    ```

3.  **Run (Local):**
    You can run the script from its directory:
    ```bash
    ./filch.js <command> <subcommand>
    ```

4.  **Run (Global - Recommended):**
    For easier use, create a symbolic link to a directory in your system's `PATH`, so you can just type `filch`.

    ```bash
    # Example for Linux/macOS
    sudo ln -s /path/to/your/filch.js /usr/local/bin/filch
    ```
    Now you can run the tool from anywhere by just typing `filch`.

## Usage

Filch is operated via command-line arguments. All commands will launch interactive prompts to guide you.

### Commands

* `filch create class`
    Starts a prompt to enter a name for a new class.

* `filch select class`
    Shows a list of existing classes and prompts you to select one as the "current" class for other operations.

* `filch insert students`
    Starts a prompt to add students (roll number and name) to the currently selected class. You can add multiple students in one session.

* `filch mark att`
    Begins the attendance-marking process for the currently selected class.
    1.  It will first ask for a date (defaulting to the current date).
    2.  It will then loop through each student in the class, asking you to mark them "P" or "A".

* `filch view leaders`
    Calculates and prints the top 3 students in the currently selected class based on their attendance percentage over the last 5 days.

### Example Workflow

```bash
# 1. Create a new class
$ filch create class
Please enter <classNameSection>: 10-A
10-A is created

# 2. Select the class to work on
$ filch select class
Please select a class [10-A]: 10-A
Working on class: 10-A
            --- to insert student: filch insert students
            --- to mark attendance: filch mark attendance
            --- to view leaderboard: filch view leaderboard

# 3. Add students to the class
$ filch insert students
Please enter roll number of student: 101
Please enter name of student belongs to this roll number 101: Alice
Student Alice (roll 101) added to 10-A.
Add another student? (y/n): y
Please enter roll number of student: 102
Please enter name of student belongs to this roll number 102: Bob
Student Bob (roll 102) added to 10-A.
Add another student? (y/n): n

# 4. Mark attendance
$ filch mark att
Please enter date for marking attendance [2025-10-25], type y for current date: y
Mark attendance for Alice Roll no: 101: p
Mark attendance for Bob Roll no: 102: a
Attedance marked successfully

# 5. View the leaderboard (after a few days)
$ filch view leaders

    ------- LEADER'S OF THE WEEK -------
    Alice - 100%
    Bob - 20%
    [Student 3] - 0%