import { L, q } from "./helpers.mjs";

// Module 4: Computer science fundamentals (topics 39 to 48). All concept lessons.
const done = "You got them all. Lesson done; come back whenever you want a refresher.";
export const lessons = [
  // 39
  {
    id: "binary-number-systems", type: "concept", title: "Binary and number systems", summary: "How computers count with only 0 and 1.", topics: [],
    explanation: ["Computers store everything as bits, which are 0s and 1s.", "Binary is base 2, where each place is worth twice the one to its right, while decimal is base 10 and hexadecimal is base 16.", "Eight bits make a byte, which can hold 256 different values."],
    illustration: "binary    1   0   1   1\nplace     8   4   2   1\n          8 + 0 + 2 + 1 = 11",
    illustrationCaption: "The binary number 1011 read place by place. The places are worth 8, 4, 2 and 1, and adding the places that hold a 1 gives 11.",
    snippets: {
      javascript: { code: L("console.log((11).toString(2));", 'console.log(parseInt("1011", 2));'), output: "1011\n11", caption: "toString(2) writes a number in binary, and parseInt with base 2 reads binary back." },
      python: { code: L('print(format(11, "b"))', 'print(int("1011", 2))'), output: "1011\n11", caption: "format(..., \"b\") writes a number in binary, and int with base 2 reads binary back." },
    },
    successMessage: done,
    check: [
      q("What is the decimal value of the binary number 101?", ["3", "5", "7"], 1, "The places are 4, 2 and 1, and 101 has a 1 in the 4 place and the 1 place, so 4 + 1 = 5.", "Add up the place values wherever there is a 1."),
      q("How many different values can one byte (8 bits) hold?", ["8", "128", "256"], 2, "Each of the 8 bits has two choices, so there are 2 to the power of 8, which is 256 values (0 to 255).", "Each extra bit doubles the number of values."),
      q("Why do computers use binary?", ["Electronic parts are simplest to build with two states, on and off", "Binary numbers are shorter than decimal ones", "Humans find binary easier to read"], 0, "Two states, such as voltage high or low, are reliable and cheap to build, so everything is stored as 0s and 1s.", "Think about a switch."),
    ],
  },
  // 40
  {
    id: "computer-architecture", type: "concept", title: "Computer architecture", summary: "CPU, memory and storage, and how they cooperate.", topics: [],
    explanation: ["The CPU runs instructions, memory (RAM) holds the data and programs in use right now, and storage keeps data when the power is off.", "The CPU is much faster than memory, and memory is much faster than storage, so computers keep recently used data close by in caches.", "A program's instructions are fetched, decoded and executed, over and over."],
    illustration: "CPU --> cache --> RAM --> disk\n\nleft:  fast, small, costly\nright: slow, large, cheap",
    illustrationCaption: "The memory hierarchy. The closer to the CPU, the faster and smaller the memory is, and the further away, the slower and larger it gets.",
    successMessage: done,
    check: [
      q("What does the CPU do?", ["Stores your files when the power is off", "Runs the instructions of programs", "Connects the computer to the internet"], 1, "The CPU fetches, decodes and executes instructions. Storage keeps files, and a network card handles the internet.", "Think of it as the part that does the work."),
      q("Why do computers have caches?", ["Memory is slower than the CPU, so keeping recently used data close saves waiting", "To make the screen brighter", "To store the operating system forever"], 0, "A cache is small, fast memory near the CPU that holds data you are likely to need again soon.", "What is the gap between the CPU and RAM?"),
      q("Which one keeps your data when the power is switched off?", ["RAM", "Cache", "Storage, such as an SSD"], 2, "RAM and cache are wiped when the power goes off. Storage such as an SSD or hard disk keeps data.", "Which one holds your saved files?"),
    ],
  },
  // 41
  {
    id: "memory-management", type: "concept", title: "Memory management", summary: "Stack, heap, references and garbage collection.", topics: [],
    explanation: ["The stack holds small, short-lived data such as a function's local variables, and the heap holds larger data that can live longer.", "A reference is a value that points to data on the heap, so two names can point to the same data.", "Garbage collection frees heap data that nothing refers to any more."],
    illustration: "stack            heap\n a -----------> [1, 2]\n b ------------^\n\n(two names, one list)",
    illustrationCaption: "Two variables on the stack, a and b, both point to the same list on the heap. Changing the list through one name changes what the other sees.",
    snippets: {
      javascript: { code: L("const a = [1];", "const b = a;", "b.push(2);", "console.log(a.length);"), output: "2", caption: "b is not a copy. It points to the same array, so pushing through b also changes a." },
      python: { code: L("a = [1]", "b = a", "b.append(2)", "print(len(a))"), output: "2", caption: "b is not a copy. It points to the same list, so appending through b also changes a." },
    },
    successMessage: done,
    check: [
      q("In the example, why is a.length 2 after pushing to b?", ["a and b point to the same array", "push changes every array in the program", "b is a copy of a"], 0, "const b = a copies the reference, not the array, so both names refer to one array on the heap.", "Is b a copy, or another name?"),
      q("What does garbage collection do?", ["Deletes your source code", "Frees memory that nothing refers to any more", "Makes the CPU run faster"], 1, "It finds heap data that no variable can reach any more and frees that memory for reuse.", "Think of taking out the rubbish nobody wants."),
      q("Which kind of data usually goes on the stack?", ["Large files", "A function's local variables, which live only while it runs", "Everything the program ever creates"], 1, "The stack is for small, short-lived data that disappears when the function returns. Larger, longer-lived data goes on the heap.", "What happens to local variables when a function ends?"),
    ],
  },
  // 42
  {
    id: "operating-system-fundamentals", type: "concept", title: "Operating system fundamentals", summary: "Processes, threads, files and system calls.", topics: [],
    explanation: ["The operating system shares the computer between programs and manages memory, files and devices.", "A process is a running program with its own memory, and a thread is a path of work inside a process that shares its memory.", "A program asks the operating system to do things, such as read a file, through system calls."],
    illustration: "your program\n   |  system call:\n   |  \"read this file\"\noperating system\n   |  drives\ndisk, screen, network",
    illustrationCaption: "A program never touches the hardware directly. It makes a system call, and the operating system does the work and hands back the result.",
    successMessage: done,
    check: [
      q("What is a process?", ["A running program with its own memory", "A kind of file", "A part of the keyboard"], 0, "A process is a program in the middle of running, and the operating system gives it its own memory.", "Think of a program that is running right now."),
      q("How does a thread differ from a process?", ["A thread has its own separate memory", "A thread is a path of work inside a process and shares the process's memory", "They are exactly the same thing"], 1, "Threads in one process share its memory, which makes sharing easy and mistakes easy. Separate processes are isolated from each other.", "Which one shares memory?"),
      q("When a program reads a file, what does it do?", ["Reads the disk hardware directly", "Makes a system call and lets the operating system do it", "Asks the user to type the file in"], 1, "Programs go through the operating system with a system call, which keeps hardware access safe and shared.", "Who is in charge of the disk?"),
    ],
  },
  // 43
  {
    id: "concurrency-parallelism", type: "concept", title: "Concurrency and parallelism", summary: "Doing many things at once, or looking like it.", topics: [],
    explanation: ["Concurrency means managing several tasks that overlap in time, and parallelism means running them at the very same moment on different CPU cores.", "Concurrency is about structure, and parallelism is about speed.", "Sharing data between tasks needs care, because two tasks changing it at once can corrupt it, which is called a race condition."],
    illustration: "concurrent (one worker):\n  A . B . A . B\n\nparallel (two workers):\n  A A A A\n  B B B B",
    illustrationCaption: "With concurrency, one worker switches between tasks A and B so both make progress. With parallelism, two workers run A and B at the same moment.",
    successMessage: done,
    check: [
      q("What is parallelism?", ["Running tasks at the very same moment on different cores", "Switching between tasks on one worker", "Writing code that has no loops"], 0, "Parallelism needs more than one core running work at once. Switching on one worker is concurrency.", "Is anything literally happening at the same moment?"),
      q("Two tasks both add 1 to a shared counter at the same time and one update is lost. What is this called?", ["A race condition", "Garbage collection", "A system call"], 0, "When the result depends on the exact timing of tasks sharing data, you have a race condition.", "The result depends on who gets there first."),
      q("Which statement is true?", ["Concurrency always makes a program faster", "A program can be concurrent on a single core", "Parallelism needs only one core"], 1, "A single core can switch between tasks, which is concurrency. Parallelism needs several cores, and concurrency alone does not guarantee speed.", "Can one worker juggle two tasks?"),
    ],
  },
  // 44
  {
    id: "asynchronous-programming", type: "concept", title: "Asynchronous programming", summary: "Callbacks, promises and async/await.", topics: [],
    explanation: ["Asynchronous code starts slow work, such as a network request, and carries on without waiting for it.", "A callback runs when the work finishes, a promise stands for a result that will arrive, and async/await lets you write the waiting as if it were normal code.", "Waiting without blocking keeps a program responsive."],
    illustration: "start the request\ncarry on with other work\n...\nresult arrives\nrun the next step",
    illustrationCaption: "An asynchronous request. The program starts the slow work, keeps going, and picks up the result later when it arrives.",
    snippets: {
      javascript: { code: L("async function job() {", "  await Promise.resolve();", '  console.log("job finished");', "}", "async function main() {", "  const task = job();", '  console.log("started the job");', "  await task;", '  console.log("all done");', "}", "main();"), output: "started the job\njob finished\nall done", caption: "main starts the job, prints, and only then waits for the job to finish." },
      python: { code: L("import asyncio", "", "async def job():", "    await asyncio.sleep(0)", '    print("job finished")', "", "async def main():", "    task = asyncio.create_task(job())", '    print("started the job")', "    await task", '    print("all done")', "", "asyncio.run(main())"), output: "started the job\njob finished\nall done", caption: "main starts the job, prints, and only then waits for the job to finish." },
    },
    successMessage: done,
    check: [
      q("What does asynchronous code let a program do?", ["Start slow work and carry on without waiting for it", "Run faster than the CPU allows", "Skip error handling"], 0, "Async code does not block while it waits, so other work, or the user interface, stays responsive.", "Think about what a program does while it waits for the network."),
      q("In the example, why is started the job printed before job finished?", ["main did not wait for the job until it reached await", "The job failed", "Printing is always first"], 0, "main started the job, carried on to the print, and only waited when it reached await.", "Look at where await sits."),
      q("What is a promise?", ["A stand-in for a result that will arrive later", "A kind of loop", "A comment about future work"], 0, "A promise represents a value that is not ready yet, and await pauses only until it is.", "It is a stand-in for a future result."),
    ],
  },
  // 45
  {
    id: "networking-fundamentals", type: "concept", title: "Networking fundamentals", summary: "IP, TCP, UDP, DNS and HTTP.", topics: [],
    explanation: ["Every device on a network has an IP address, and DNS turns a name like example.com into that address.", "TCP delivers data reliably and in order, UDP is faster but may lose or reorder data, and HTTP is the language browsers and servers speak on top of TCP.", "A request goes out and a response comes back, each with a status code and sometimes data."],
    illustration: "browser --DNS--> 93.184.216.34\nbrowser --HTTP request--> server\nbrowser <--HTTP response-- server",
    illustrationCaption: "Loading a page. The browser first asks DNS for the server's address, then sends an HTTP request to it and gets an HTTP response back.",
    snippets: {
      javascript: { code: L('const url = new URL("https://example.com:8080/docs?page=2");', 'console.log(url.hostname, url.port, url.searchParams.get("page"));'), output: "example.com 8080 2", caption: "A URL has a host name, an optional port and a query string." },
      python: { code: L("from urllib.parse import urlparse, parse_qs", 'url = urlparse("https://example.com:8080/docs?page=2")', 'print(url.hostname, url.port, parse_qs(url.query)["page"][0])'), output: "example.com 8080 2", caption: "A URL has a host name, an optional port and a query string." },
    },
    successMessage: done,
    check: [
      q("What does DNS do?", ["Encrypts your messages", "Turns a name like example.com into an IP address", "Makes pages load faster"], 1, "DNS is the internet's phone book, turning names people remember into the addresses computers use.", "Computers need an address, not a name."),
      q("Which protocol guarantees data arrives complete and in order?", ["UDP", "TCP", "DNS"], 1, "TCP re-sends lost data and keeps order. UDP skips that for speed, which suits live video or games.", "One of them trades reliability for speed."),
      q("In the example, which part is the port?", ["example.com", "8080", "page=2"], 1, "The port is the number after the colon, 8080. example.com is the host, and page=2 is part of the query.", "It is the number after the colon."),
    ],
  },
  // 46
  {
    id: "data-serialization", type: "concept", title: "Data serialization", summary: "JSON, XML and binary formats.", topics: [],
    explanation: ["Serialization turns data in memory into text or bytes that can be stored or sent, and deserialization turns it back.", "JSON and XML are text formats that people can read, while binary formats are smaller and faster but not readable.", "Both sides must agree on the format, or the data cannot be understood."],
    illustration: "object in memory\n   |  serialize\n   v\n{\"name\":\"Ada\",\"age\":12}\n   |  deserialize\n   v\nobject again",
    illustrationCaption: "Data is turned into JSON text so it can be saved or sent, and turned back into an object on the other side.",
    snippets: {
      javascript: { code: L('const text = JSON.stringify({ name: "Ada", age: 12 });', "console.log(text);", "console.log(JSON.parse(text).age);"), output: '{"name":"Ada","age":12}\n12', caption: "JSON.stringify serializes, and JSON.parse deserializes." },
      python: { code: L("import json", 'text = json.dumps({"name": "Ada", "age": 12})', "print(text)", 'print(json.loads(text)["age"])'), output: '{"name": "Ada", "age": 12}\n12', caption: "json.dumps serializes, and json.loads deserializes. Python adds spaces after the colons and commas." },
    },
    successMessage: done,
    check: [
      q("What is serialization?", ["Turning data in memory into text or bytes that can be stored or sent", "Putting items in numbered order", "Making a program run in series"], 0, "Serialization converts in-memory data into a format for storage or transport, and deserialization reverses it.", "Think about saving an object to a file."),
      q("Why might you choose a binary format over JSON?", ["It is easier for people to read", "It is smaller and faster to process", "It needs no agreement between the sender and receiver"], 1, "Binary formats pack data tightly, but people cannot read them directly. Both sides still must agree on the format.", "What do you trade away when you give up readability?"),
      q("What happens if the sender and receiver disagree about the format?", ["The receiver cannot understand the data", "The data repairs itself", "Nothing, formats are optional"], 0, "A format is a shared agreement, and without it the bytes have no meaning to the receiver.", "How would you read a language nobody told you about?"),
    ],
  },
  // 47
  {
    id: "database-fundamentals", type: "concept", title: "Database fundamentals", summary: "Tables, relationships, SQL and NoSQL.", topics: [],
    explanation: ["A relational database stores data in tables of rows and columns, and relationships link rows in one table to rows in another.", "SQL is the language for asking questions of a relational database, such as selecting the rows that match a condition.", "NoSQL databases store data in other shapes, such as documents or key-value pairs, and trade some structure for flexibility."],
    illustration: "users          orders\nid name        id user total\n1  Ada         7  1    20\n2  Mia         8  1    35\n\norders.user -> users.id",
    illustrationCaption: "Two tables linked by a relationship. Each order stores the id of the user who made it, so Ada's two orders both point to user 1.",
    snippets: {
      python: { code: L("import sqlite3", "", 'db = sqlite3.connect(":memory:")', 'db.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")', "db.execute(\"INSERT INTO users (name) VALUES ('Ada'), ('Mia')\")", 'for row in db.execute("SELECT name FROM users WHERE id = 2"):', "    print(row[0])"), output: "Mia", caption: "SQL creates a table, adds rows and selects the row whose id is 2. Python's built-in sqlite3 runs it." },
    },
    successMessage: done,
    check: [
      q("In a relational database, what does a relationship do?", ["Links rows in one table to rows in another", "Sorts the rows alphabetically", "Encrypts a table"], 0, "A relationship, usually a stored id, connects related rows, like an order and the user who placed it.", "Look at orders.user in the picture."),
      q("What is SQL used for?", ["Styling web pages", "Asking questions of, and changing, a relational database", "Compiling programs"], 1, "SQL is the standard language for querying and updating relational databases.", "SELECT is one of its words."),
      q("What is a common trade-off of NoSQL databases?", ["They store data in flexible shapes but give up some of the structure and guarantees of tables", "They can only store numbers", "They never lose data in any situation"], 0, "Document and key-value stores are flexible and often scale easily, but you give up some structure and sometimes some guarantees.", "What does flexible usually cost?"),
    ],
  },
  // 48
  {
    id: "data-integrity-transactions", type: "concept", title: "Data integrity and transactions", summary: "Constraints and ACID.", topics: [],
    explanation: ["Data integrity means the data stays correct and consistent, which databases protect with constraints such as unique keys and required values.", "A transaction groups several changes so they all succeed or all fail together.", "ACID stands for atomicity, consistency, isolation and durability, the four promises a reliable transaction makes."],
    illustration: "BEGIN\n  take 50 from Ada\n  give 50 to Mia\nCOMMIT      all changes stick\n\nan error?  ROLLBACK, nothing changed",
    illustrationCaption: "A money transfer as a transaction. Either both steps happen and are committed, or an error undoes everything and the balances stay as they were.",
    snippets: {
      python: { code: L("import sqlite3", "", 'db = sqlite3.connect(":memory:")', 'db.execute("CREATE TABLE accounts (name TEXT PRIMARY KEY, balance INTEGER CHECK (balance >= 0))")', "db.execute(\"INSERT INTO accounts VALUES ('Ada', 100)\")", "db.commit()", "try:", "    with db:", "        db.execute(\"UPDATE accounts SET balance = balance - 30 WHERE name = 'Ada'\")", "        db.execute(\"UPDATE accounts SET balance = balance - 90 WHERE name = 'Ada'\")", "except sqlite3.IntegrityError:", '    print("rolled back")', 'print(db.execute("SELECT balance FROM accounts").fetchone()[0])'), output: "rolled back\n100", caption: "The second update breaks the CHECK constraint, so the whole transaction is rolled back, including the first update, and the balance is still 100." },
    },
    successMessage: done,
    check: [
      q("What does a transaction guarantee?", ["Its changes all succeed or all fail together", "Every query is fast", "Nobody else can read the data"], 0, "That all-or-nothing property is called atomicity, and it keeps data from being left half changed.", "Think about the money transfer."),
      q("In the example, why is the balance still 100?", ["The first update was never run", "The second update broke the rule, so the whole transaction was undone", "The database ignores updates"], 1, "The CHECK constraint rejected the second update, so the transaction rolled back, undoing the first update as well.", "What did the rollback undo?"),
      q("What is the job of a constraint such as CHECK (balance >= 0)?", ["To keep invalid data from being stored", "To speed up queries", "To back up the data"], 0, "Constraints are rules the database enforces so that bad data cannot get in.", "It is a rule the data must obey."),
    ],
  },
];
