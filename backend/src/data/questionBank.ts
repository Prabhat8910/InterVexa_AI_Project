export interface Question {
  id: string;
  topic: 'Core CS' | 'Programming' | 'DBMS' | 'OS' | 'HR';
  subtopic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionText: string;
  expectedAnswer: string;
  keyConcepts: string[];
  followUpQuestions: string[];
  hints: string[];
  evaluationCriteria: string[];
}

export const questionBank: Question[] = [
  // --- Core CS ---
  {
    id: "q_core_01",
    topic: "Core CS",
    subtopic: "Object Oriented Programming",
    difficulty: "Easy",
    questionText: "Explain the four core principles of Object-Oriented Programming (OOP) and give a brief real-world analogy for one of them.",
    expectedAnswer: "The four core principles of OOP are Encapsulation (hiding internal state and requiring all interaction to be performed through an object's methods), Inheritance (allowing a new class to inherit properties and behaviors of an existing class), Polymorphism (the ability of different classes to respond to the same message or method call in different ways), and Abstraction (hiding complex details and showing only the essential features). A common analogy is a car driver interface: the steering wheel and pedals are an abstraction; encapsulation hides the internal engine mechanics; inheritance allows creating sports cars from a base vehicle template; polymorphism allows different cars to implement 'accelerate' differently.",
    keyConcepts: ["Encapsulation", "Inheritance", "Polymorphism", "Abstraction"],
    followUpQuestions: [
      "What is the difference between interface inheritance and implementation inheritance?",
      "Why is composition often preferred over inheritance in modern OOP design?"
    ],
    hints: [
      "Think of the acronym EIPA.",
      "Consider how abstraction differs from encapsulation."
    ],
    evaluationCriteria: [
      "Must correctly name all four principles.",
      "Must provide a valid explanation of each principle.",
      "Must include a coherent analogy."
    ]
  },
  {
    id: "q_core_02",
    topic: "Core CS",
    subtopic: "Design Patterns",
    difficulty: "Medium",
    questionText: "Explain the Singleton Design Pattern. What are its benefits, when should it be avoided, and how does it affect thread safety?",
    expectedAnswer: "The Singleton Design Pattern ensures that a class has only one instance and provides a global point of access to it. It is beneficial for managing shared resources like database connection pools or configuration managers. However, it can make unit testing difficult because it introduces global state, violates the Single Responsibility Principle, and couples code tightly. For thread safety, developers must use synchronization (like double-checked locking in Java/C++ or using static initialization) to prevent multiple threads from instantiating separate instances concurrently.",
    keyConcepts: ["Singleton", "Global access", "Thread safety", "Double-checked locking", "Lazy initialization"],
    followUpQuestions: [
      "When should the Singleton pattern NOT be used?",
      "How would Spring framework implement or manage Singleton scoped beans?"
    ],
    hints: [
      "Focus on the private constructor and static getInstance method.",
      "Think about lazy vs. eager initialization in multi-threaded environments."
    ],
    evaluationCriteria: [
      "Must define what a Singleton is and how to implement it.",
      "Must list drawbacks such as testing issues and global state coupling.",
      "Must explain thread-safety challenges and solution strategies like synchronization."
    ]
  },
  {
    id: "q_core_03",
    topic: "Core CS",
    subtopic: "SOLID Principles",
    difficulty: "Hard",
    questionText: "Detail the SOLID design principles. Pick two of them and explain the problems that arise if they are violated.",
    expectedAnswer: "SOLID stands for: Single Responsibility Principle (SRP - a class should have one reason to change), Open/Closed Principle (OCP - software entities should be open for extension but closed for modification), Liskov Substitution Principle (LSP - subtypes must be substitutable for their base types), Interface Segregation Principle (ISP - clients shouldn't be forced to depend on methods they don't use), and Dependency Inversion Principle (DIP - depend on abstractions, not concretions). Violating LSP (e.g. creating a Square class that inherits from Rectangle) causes code to behave incorrectly when utilizing base pointers. Violating SRP leads to monolithic classes that are hard to test and maintain, where changing one functionality accidentally breaks another.",
    keyConcepts: ["SOLID", "SRP", "OCP", "LSP", "ISP", "DIP", "Substitutability", "Dependency inversion"],
    followUpQuestions: [
      "How does the Dependency Inversion Principle relate to Dependency Injection?",
      "Can you give an code example of ISP violation and how you would segregate it?"
    ],
    hints: [
      "Recite the full acronym.",
      "For LSP, think of the classic rectangle/square or duck analogy."
    ],
    evaluationCriteria: [
      "Must correctly state all 5 SOLID principles.",
      "Must choose two principles and clearly explain the concrete code smells or bugs that occur when they are violated."
    ]
  },

  // --- Programming ---
  {
    id: "q_prog_01",
    topic: "Programming",
    subtopic: "Strings and Arrays",
    difficulty: "Easy",
    questionText: "Describe an efficient algorithm to check if a string contains all unique characters. What is the time and space complexity?",
    expectedAnswer: "A simple and efficient approach is to use a Hash Set or a boolean lookup array matching the character set (e.g. 128 elements for ASCII, or 256 for extended ASCII). We iterate through the string, check if the character is already in the set/array. If yes, it is not unique. If we reach the end, it is unique. The time complexity is O(N) where N is the length of the string, or O(1) if the character set size is fixed (as we return false if length exceeds the character set size). Space complexity is O(K) where K is the size of the character set (which is O(1) because it is bounded by the alphabet size).",
    keyConcepts: ["Hash Set", "ASCII", "Time complexity O(N)", "Space complexity O(1)", "Boolean array"],
    followUpQuestions: [
      "What if you cannot use any additional data structures (in-place)?",
      "How would a bitwise mask optimization work for this problem?"
    ],
    hints: [
      "Consider the maximum possible length of a string of unique characters.",
      "What data structure lets you do O(1) lookups?"
    ],
    evaluationCriteria: [
      "Must propose a solution using a set, map, or boolean array.",
      "Must explain that if length > charset size, we can return false immediately.",
      "Must correctly state O(N) time and O(1) space complexities."
    ]
  },
  {
    id: "q_prog_02",
    topic: "Programming",
    subtopic: "Data Structures",
    difficulty: "Medium",
    questionText: "How do you reverse a singly linked list in-place? Explain the pointer manipulation steps, and state the time and space complexity.",
    expectedAnswer: "To reverse a singly linked list in-place, we use three pointers: 'prev' (initialized to null), 'current' (initialized to head), and 'next' (temporary). We iterate through the list. In each step: we store 'current.next' in 'next', then redirect 'current.next' to point to 'prev'. Finally, we advance 'prev' to 'current' and 'current' to 'next'. Once 'current' is null, the new head is 'prev'. The time complexity is O(N) since we visit every node once, and the space complexity is O(1) because we only use a few pointer variables.",
    keyConcepts: ["Singly linked list", "In-place reversal", "Three-pointer iteration", "O(N) Time", "O(1) Space"],
    followUpQuestions: [
      "Can you write or explain the recursive version of this algorithm?",
      "What is the space complexity of the recursive approach due to call stack overhead?"
    ],
    hints: [
      "Keep track of the node *after* the current one before breaking the link.",
      "Think about where the head node ends up."
    ],
    evaluationCriteria: [
      "Must correctly explain the three pointers: prev, current, and next.",
      "Must explain the step-by-step update: temp=curr.next, curr.next=prev, prev=curr, curr=temp.",
      "Must state O(N) time and O(1) space complexity."
    ]
  },
  {
    id: "q_prog_03",
    topic: "Programming",
    subtopic: "System Design / Coding",
    difficulty: "Hard",
    questionText: "Explain how you would design an LRU (Least Recently Used) Cache. What data structures would you combine to achieve O(1) get and put operations?",
    expectedAnswer: "To design an LRU cache with O(1) lookup and eviction, we combine a Hash Map and a Doubly Linked List. The Hash Map provides O(1) key-value lookup, mapping keys to nodes in the doubly linked list. The Doubly Linked List maintains the access order: when a key is accessed (read or updated), we move its corresponding node to the head of the list in O(1) time. When the cache exceeds capacity, we evict the least recently used element from the tail of the list in O(1) time and delete its entry from the Hash Map.",
    keyConcepts: ["LRU Cache", "Hash Map", "Doubly Linked List", "O(1) Operations", "Eviction policy", "Tail and Head nodes"],
    followUpQuestions: [
      "Why is a singly linked list insufficient for O(1) eviction/updates?",
      "How would you make this design thread-safe in a multi-threaded system?"
    ],
    hints: [
      "How do you remove a node from the middle of a list in O(1) time?",
      "What does the Hash Map store as its value?"
    ],
    evaluationCriteria: [
      "Must identify the combination of Hash Map and Doubly Linked List.",
      "Must explain why BOTH are needed for O(1) lookup and O(1) pointer updates.",
      "Must walk through the get and put algorithms including eviction."
    ]
  },

  // --- DBMS ---
  {
    id: "q_dbms_01",
    topic: "DBMS",
    subtopic: "Relational Concepts",
    difficulty: "Easy",
    questionText: "What is the difference between a Primary Key and a Foreign Key? How do they enforce referential integrity?",
    expectedAnswer: "A Primary Key uniquely identifies each record in a database table. It must contain unique, non-null values. A Foreign Key is a field (or collection of fields) in one table that refers to the Primary Key in another table. Primary keys ensure entity integrity (each row is unique), while foreign keys enforce referential integrity by preventing actions that would destroy links between tables (e.g. deleting a parent row when matching child rows exist, or inserting a child row with a non-existent parent key).",
    keyConcepts: ["Primary Key", "Foreign Key", "Referential Integrity", "Entity Integrity", "Uniqueness", "Cascading deletes"],
    followUpQuestions: [
      "What are composite keys, and when should you use them?",
      "What does ON DELETE CASCADE do in a foreign key constraint?"
    ],
    hints: [
      "One is about identifying rows in the same table, the other is about creating relations between tables.",
      "What happens if a child points to a parent that doesn't exist?"
    ],
    evaluationCriteria: [
      "Must define primary key uniqueness and non-null constraints.",
      "Must explain how foreign keys link tables.",
      "Must explain referential integrity enforcement."
    ]
  },
  {
    id: "q_dbms_02",
    topic: "DBMS",
    subtopic: "Transactions",
    difficulty: "Medium",
    questionText: "Explain the ACID properties of a database transaction. Provide a brief example of how one of these properties prevents database corruption.",
    expectedAnswer: "ACID stands for Atomicity (all operations in a transaction succeed or all fail/rollback), Consistency (transaction takes database from one valid state to another, maintaining constraints), Isolation (concurrent execution of transactions results in a state equivalent to serial execution), and Durability (once committed, changes survive system crashes). For example, Atomicity prevents corruption during a bank transfer: if money is debited from Account A, but the system crashes before crediting Account B, the entire transaction is rolled back so money is not lost or created.",
    keyConcepts: ["ACID", "Atomicity", "Consistency", "Isolation", "Durability", "Transaction Rollback", "State Transition"],
    followUpQuestions: [
      "What are the transaction isolation levels, and what anomalies (like dirty reads) do they solve?",
      "How does a database write-ahead log (WAL) help achieve Durability?"
    ],
    hints: [
      "Think of the bank transfer scenario.",
      "Atomicity is all-or-nothing."
    ],
    evaluationCriteria: [
      "Must correctly identify all 4 ACID properties.",
      "Must explain each property's role.",
      "Must provide a concrete example showing how it prevents corruption."
    ]
  },
  {
    id: "q_dbms_03",
    topic: "DBMS",
    subtopic: "Indexing",
    difficulty: "Hard",
    questionText: "How does database indexing work? Explain the difference between Clustered and Non-Clustered indexes, and describe why a B-Tree structure is used.",
    expectedAnswer: "A database index is a data structure (usually a B-Tree or B+Tree) that improves data retrieval speed at the cost of slower writes and additional storage. A Clustered Index determines the physical order of data rows in the table; hence, there can only be one clustered index per table. A Non-Clustered Index contains a sorted list of keys with pointers pointing to the actual data location (the row identifier or clustered index key). B-Trees are used because they are balanced search trees with a high branching factor, which minimizes the number of disk I/O operations required to find a record by keeping the tree depth small and flat.",
    keyConcepts: ["Database Index", "Clustered Index", "Non-Clustered Index", "B-Tree / B+Tree", "Disk I/O", "Branching factor"],
    followUpQuestions: [
      "Under what conditions would a database engine perform a index scan versus a index seek?",
      "Why do write operations (INSERT, UPDATE, DELETE) become slower when we add more indexes?"
    ],
    hints: [
      "Clustered index is the table itself ordered physically.",
      "Think about disk read operations. Why not use a standard binary search tree?"
    ],
    evaluationCriteria: [
      "Must explain clustered index as physical ordering of data.",
      "Must explain non-clustered index as a separate lookup table of key-pointer pairs.",
      "Must explain that B-Trees reduce disk I/O reads by having a flat, balanced, wide-node structure."
    ]
  },

  // --- OS ---
  {
    id: "q_os_01",
    topic: "OS",
    subtopic: "Processes and Threads",
    difficulty: "Easy",
    questionText: "What is the difference between a process and a thread? Explain how they manage memory and share state.",
    expectedAnswer: "A process is an execution instance of a program that has its own independent address space, memory (heap, stack), file descriptors, and security context. A thread is the smallest unit of execution within a process. Multiple threads belong to a single process and share that process's address space, heap, and open files, but each thread has its own program counter, registers, and stack. Because threads share memory, communication between threads is fast but requires synchronization, whereas process communication (IPC) is slower because it requires system calls.",
    keyConcepts: ["Process", "Thread", "Shared memory", "Address space", "IPC (Inter-Process Communication)", "Context switching", "Thread Stack"],
    followUpQuestions: [
      "What is context switching, and why is thread context switching faster than process context switching?",
      "What is a race condition, and how do mutexes solve it?"
    ],
    hints: [
      "Think about container versus contents.",
      "Who shares what? Heap vs. Stack."
    ],
    evaluationCriteria: [
      "Must define process as an independent address space, and thread as execution within a process.",
      "Must explain what is shared (heap, files) and what is private (stack, registers).",
      "Must touch upon ease/complexity of communication (IPC vs. shared memory)."
    ]
  },
  {
    id: "q_os_02",
    topic: "OS",
    subtopic: "Memory Management",
    difficulty: "Medium",
    questionText: "What is Virtual Memory? Explain the concepts of Paging, Page Faults, and Thrashing.",
    expectedAnswer: "Virtual Memory is a memory management technique that gives a process the illusion of having a large contiguous block of memory, mapping virtual addresses to physical RAM or secondary storage. Paging divides virtual memory into fixed-size blocks called pages, and physical RAM into frames. A Page Fault occurs when a program tries to access a page that is not currently mapped into physical RAM, triggering the OS to load it from the disk. Thrashing occurs when a system spends more time context-switching and swapping pages in and out of disk than executing instructions, causing performance to collapse.",
    keyConcepts: ["Virtual Memory", "Paging", "Page Table", "Page Fault", "Thrashing", "Swapping", "Disk I/O bottleneck"],
    followUpQuestions: [
      "How does the Translation Lookaside Buffer (TLB) speed up address translation?",
      "Explain a page replacement algorithm like Least Recently Used (LRU) or FIFO."
    ],
    hints: [
      "Virtual memory acts as a buffer between RAM and hard disk.",
      "What happens when the RAM is full and the CPU is constantly reading from disk?"
    ],
    evaluationCriteria: [
      "Must explain virtual memory address mapping.",
      "Must explain paging (fixed blocks) and page faults (miss in RAM).",
      "Must define thrashing as the state where page swapping dominates CPU cycles."
    ]
  },
  {
    id: "q_os_03",
    topic: "OS",
    subtopic: "Deadlocks",
    difficulty: "Hard",
    questionText: "What is a Deadlock? Explain the four Coffman conditions required for a deadlock to occur, and how they can be prevented.",
    expectedAnswer: "A deadlock is a situation where two or more processes are blocked indefinitely, each waiting for a resource held by the other. The four Coffman conditions are: Mutual Exclusion (only one process can use a resource at a time), Hold and Wait (processes holding allocated resources can request new ones), No Preemption (resources cannot be forcibly taken from a process), and Circular Wait (a closed chain of processes exists where each waits for a resource held by the next). To prevent deadlocks, we must break at least one condition, such as enforcing resource ordering to eliminate circular wait, or requiring processes to request all resources upfront to break hold-and-wait.",
    keyConcepts: ["Deadlock", "Coffman conditions", "Mutual Exclusion", "Hold and Wait", "No Preemption", "Circular Wait", "Resource ordering", "Deadlock Prevention vs Avoidance"],
    followUpQuestions: [
      "What is the difference between Deadlock Prevention and Deadlock Avoidance (e.g., Banker's Algorithm)?",
      "How do deadlock detection and recovery strategies work?"
    ],
    hints: [
      "Think of the dining philosophers problem.",
      "To break circular wait, we order the resources."
    ],
    evaluationCriteria: [
      "Must define deadlock.",
      "Must list all four Coffman conditions accurately.",
      "Must explain at least two concrete strategies to prevent deadlock by breaking these conditions."
    ]
  },

  // --- HR ---
  {
    id: "q_hr_01",
    topic: "HR",
    subtopic: "Introduction",
    difficulty: "Easy",
    questionText: "Tell me about yourself. Walk me through your background, your interest in this role, and what makes you a strong candidate.",
    expectedAnswer: "A strong response follows a 'Present-Past-Future' structure: starting with the current situation (e.g. current studies or projects), highlighting key past achievements/skills/projects, and connecting it to the future goal of contributing to the specific company in the target role. The candidate should be professional, clear, and display enthusiasm.",
    keyConcepts: ["Introduction", "Professional history", "Interest in role", "Present-Past-Future", "Communication skills"],
    followUpQuestions: [
      "Why are you interested in working specifically for our company?",
      "What do you consider to be your single greatest professional strength?"
    ],
    hints: [
      "Start with what you are doing right now, then reference your key skills/achievements, and end with why you are here.",
      "Keep it under 2 minutes."
    ],
    evaluationCriteria: [
      "Candidate walks through their education, experience, or key projects.",
      "Candidate articulates interest in the role.",
      "Speech is structured, concise, and professional."
    ]
  },
  {
    id: "q_hr_02",
    topic: "HR",
    subtopic: "Conflict Resolution",
    difficulty: "Medium",
    questionText: "Describe a situation where you had a conflict or disagreement with a teammate or project partner. How did you resolve it, and what did you learn?",
    expectedAnswer: "A strong response uses the STAR method (Situation, Task, Action, Result). The candidate should describe a professional disagreement (e.g. choice of technology or project division), focus on active listening and compromise actions they took, explain the positive outcome (e.g., project completed successfully, relationship preserved), and highlight what they learned about communication or project management.",
    keyConcepts: ["Conflict resolution", "STAR method", "Professionalism", "Active listening", "Compromise", "Collaborative outcome"],
    followUpQuestions: [
      "If the conflict could not be resolved, how would you escalate it responsibly?",
      "How do you handle feedback that you disagree with?"
    ],
    hints: [
      "Avoid badmouthing the teammate; focus on the difference in ideas/approaches.",
      "Make sure to emphasize *how* you listened and *what* compromise was made."
    ],
    evaluationCriteria: [
      "Must describe a specific context using the STAR format.",
      "Must show constructive actions like dialogue, data evaluation, or compromise.",
      "Must share a clear lesson learned and a successful project conclusion."
    ]
  },
  {
    id: "q_hr_03",
    topic: "HR",
    subtopic: "Failure / Learning",
    difficulty: "Medium",
    questionText: "Tell me about a time you failed to meet a deadline or made a critical mistake in a project. How did you handle it and what steps did you take to correct it?",
    expectedAnswer: "The candidate should take full ownership of the failure without making excuses. They should describe the situation, explain how they proactively communicated the mistake/delay to stakeholders, how they resolved or mitigated the impact, and the preventive systems or processes they put in place afterwards (e.g. setting buffer times, writing unit tests, breaking down tasks).",
    keyConcepts: ["Accountability", "Proactive communication", "Mitigation action", "Post-mortem learning", "Systematic improvement"],
    followUpQuestions: [
      "How do you prioritize your tasks when everything seems high priority?",
      "How do you handle stress and pressure in a fast-paced work environment?"
    ],
    hints: [
      "Select a real failure, but focus the majority of your answer on the resolution, accountability, and the long-term corrective steps you implemented."
    ],
    evaluationCriteria: [
      "Candidate takes clear ownership of the issue.",
      "Candidate describes proactive communication of the issue.",
      "Candidate explains the specific actions taken to fix it and the prevention mechanisms put in place."
    ]
  }
];
