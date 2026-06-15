const { all, get, run } = require('../config/database');

const SAMPLE_NOTES = [
  {
    title: 'DSA Revision - Sorting Algorithms',
    content: 'Key sorting algorithms and their complexities:\n\n**Bubble Sort**: O(n²) time, simple but inefficient\n**Merge Sort**: O(n log n) time, stable, requires extra space\n**Quick Sort**: O(n log n) average, O(n²) worst, in-place\n**Heap Sort**: O(n log n) guaranteed, not stable\n\nUse cases:\n- Interview questions love sorting\n- String sorting: use comparison-based or radix sort\n- Nearly sorted data: insertion sort performs well',
    tags: 'dsa,algorithms,sorting,interview'
  },
  {
    title: 'Operating Systems Summary',
    content: 'Core OS concepts to master:\n\n**Processes vs Threads**:\n- Process: Independent with own memory space\n- Thread: Lightweight, shares memory with process\n- Context switching overhead: process > thread\n\n**CPU Scheduling**:\n- FCFS: Simple, can cause starvation\n- Round Robin: Fair for all processes\n- Priority Scheduling: Adjust for I/O vs CPU bound\n\n**Memory Management**:\n- Paging: Fixed-size blocks, prevents fragmentation\n- Segmentation: Variable-size, logical units\n- Virtual Memory: Extends RAM with disk\n\n**Deadlock Prevention**: ABCD - Avoid Mutual exclusion, Break hold and wait, no Circular wait, or detect/recover',
    tags: 'os,operating-systems,processes,memory'
  },
  {
    title: 'Database Systems Notes',
    content: 'Important database concepts:\n\n**SQL Joins**:\n- INNER JOIN: Only matching rows\n- LEFT JOIN: All from left table + matches\n- FULL OUTER JOIN: All rows from both\n- CROSS JOIN: Cartesian product\n\n**Normalization**:\n- 1NF: Atomic values, no repeating groups\n- 2NF: 1NF + no partial dependencies\n- 3NF: 2NF + no transitive dependencies\n- BCNF: Stricter than 3NF\n\n**Indexing**:\n- B-Tree: Standard choice, supports range queries\n- Hash Index: Fast equality, no range\n- Composite Index: Multiple columns, order matters\n- Index overhead: Slows writes, speeds reads\n\n**Transaction Properties** (ACID):\n- Atomicity: All or nothing\n- Consistency: Valid state to valid state\n- Isolation: Concurrent safety\n- Durability: Persistent after commit',
    tags: 'database,sql,normalization,indexing'
  },
  {
    title: 'Machine Learning Basics',
    content: 'ML fundamentals you need to know:\n\n**Learning Types**:\n- Supervised: Labeled data (regression, classification)\n- Unsupervised: No labels (clustering, dimensionality reduction)\n- Reinforcement: Agent learns from environment\n\n**Overfitting vs Underfitting**:\n- Overfitting: Too complex, memorizes training data\n- Underfitting: Too simple, misses patterns\n- Solution: Cross-validation, regularization, more data\n\n**Model Evaluation Metrics**:\n- Accuracy: (TP+TN)/(Total) - use with balanced data\n- Precision: TP/(TP+FP) - focus on false positives\n- Recall: TP/(TP+FN) - focus on false negatives\n- F1-Score: Harmonic mean of precision and recall\n\n**Preprocessing Steps**:\n- Handling missing values\n- Feature scaling/normalization\n- Categorical encoding\n- Outlier detection',
    tags: 'machine-learning,ai,ml-basics'
  },
  {
    title: 'Exam Preparation Strategy',
    content: 'Effective study techniques:\n\n**Pomodoro Technique**:\n- 25 min focused work + 5 min break\n- After 4 cycles, take 15-30 min break\n- Reduces burnout and maintains focus\n\n**Active Recall**:\n- Don\'t just re-read notes\n- Test yourself frequently\n- Flashcards work well\n- Teach concepts to others\n\n**Revision Schedule**:\n- Day 1: Learn new content\n- Day 3: Review and connect\n- Week 2: Practice problems\n- Week 3: Full mock test\n- Day before: Light review only\n\n**Stress Management**:\n- Adequate sleep (7-8 hours)\n- Regular exercise\n- Healthy meals, hydration\n- Study in groups for motivation',
    tags: 'exam-prep,study-tips,productivity'
  },
  {
    title: 'React Hooks Cheatsheet',
    content: 'Essential React Hooks patterns:\n\n**useState**:\n```javascript\nconst [state, setState] = useState(initialValue);\n// Best for simple state management\n```\n\n**useEffect**:\n```javascript\nuseEffect(() => { ... }, [dependencies]);\n// Runs after render if dependencies changed\n// Empty array = runs once on mount\n```\n\n**useMemo**:\n```javascript\nconst memoized = useMemo(() => expensiveCalc(a, b), [a, b]);\n// Memoizes computation, recalculates if deps change\n```\n\n**useCallback**:\n```javascript\nconst memoFunc = useCallback(() => { ... }, [deps]);\n// Memoizes function reference\n// Useful for child component optimization\n```\n\n**useRef**:\n```javascript\nconst ref = useRef(null);\n// Direct DOM access, doesn\'t trigger re-render\n```\n\n**Custom Hooks**:\n- Reusable logic extracted from components\n- Name must start with "use"\n- Rules of Hooks apply inside custom hooks',
    tags: 'react,javascript,frontend,hooks'
  },
  {
    title: 'Web Development Stack Overview',
    content: 'Modern web development tools and best practices:\n\n**Frontend**:\n- React: Component-based UI\n- State Management: Context API, Redux, or Zustand\n- Styling: Tailwind CSS, CSS Modules, Styled Components\n- Build: Vite, Webpack, Parcel\n\n**Backend**:\n- Node.js + Express: Fast, JavaScript everywhere\n- Python + Django/FastAPI: Great for data processing\n- Database: PostgreSQL (relational), MongoDB (document)\n- Caching: Redis for sessions and frequent queries\n\n**DevOps**:\n- Version Control: Git + GitHub/GitLab\n- CI/CD: GitHub Actions, GitLab CI, Jenkins\n- Containerization: Docker for consistency\n- Deployment: AWS, Vercel, Render, DigitalOcean\n\n**Best Practices**:\n- Write clean, readable code\n- Use Git workflow: feature branches, PRs\n- Test regularly: unit, integration, E2E\n- Monitor and log application performance\n- Security: Input validation, HTTPS, env vars',
    tags: 'web-dev,fullstack,technology-stack'
  },
  {
    title: 'System Design Fundamentals',
    content: 'Key concepts for designing scalable systems:\n\n**Scalability Types**:\n- Vertical: Add more resources to single machine\n- Horizontal: Add more machines\n- Better: Horizontal is more flexible\n\n**Load Balancing**:\n- Distribute traffic across servers\n- Algorithms: Round-robin, least connections, IP hash\n- Tools: Nginx, HAProxy, AWS ELB\n\n**Caching Strategies**:\n- Write-through: Update cache and DB simultaneously\n- Write-behind: Update cache first, DB later (faster, riskier)\n- Cache invalidation: Hardest problem in CS!\n- LRU eviction: Remove least recently used items\n\n**Database Sharding**:\n- Partition data across multiple databases\n- Challenges: Data distribution, consistency\n- When to use: Very large datasets\n\n**API Design**:\n- RESTful conventions: GET, POST, PUT, DELETE\n- Pagination: Limit results per page\n- Rate limiting: Prevent abuse\n- Versioning: /api/v1/, /api/v2/ for backwards compatibility',
    tags: 'system-design,architecture,scalability'
  }
];

/**
 * Seeds the notes table with sample data for a user if they have no notes
 * @param {number} userId - The user ID to seed notes for
 * @returns {Promise<number>} - Number of notes inserted
 */
async function seedNotesIfEmpty(userId) {
  try {
    // Check if user already has notes
    const result = await get(
      'SELECT COUNT(*) as count FROM notes WHERE user_id = ?',
      [userId]
    );

    if (result && result.count > 0) {
      console.log(`[StudyPal] Notes already exist for user: ${userId}, skipping seed`);
      return 0;
    }

    // Batch insert all sample notes
    let insertedCount = 0;
    for (const note of SAMPLE_NOTES) {
      try {
        await run(
          `INSERT INTO notes (user_id, title, content, tags, created_at, updated_at) 
           VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [userId, note.title, note.content, note.tags]
        );
        insertedCount++;
      } catch (err) {
        console.error(`[StudyPal] Failed to insert note "${note.title}":`, err.message);
      }
    }

    if (insertedCount > 0) {
      console.log(`[StudyPal] Notes seeded for user: ${userId} (${insertedCount} notes inserted)`);
    }

    return insertedCount;
  } catch (err) {
    console.error('[StudyPal] Error checking notes for seeding:', err.message);
    return 0;
  }
}

/**
 * Utility function to seed notes for all users in the system
 * Useful for development and testing
 * @returns {Promise<number>} - Total number of notes inserted across all users
 */
async function seedNotesGlobally() {
  try {
    const users = await all('SELECT id FROM users', []);
    let totalInserted = 0;

    for (const user of users) {
      const inserted = await seedNotesIfEmpty(user.id);
      totalInserted += inserted;
    }

    return totalInserted;
  } catch (err) {
    console.error('[StudyPal] Error seeding notes globally:', err.message);
    return 0;
  }
}

/**
 * Removes legacy auto-seeded sample notes for users.
 * A user is cleaned only if all sample note signatures are present.
 * @returns {Promise<number>} - Total number of sample notes removed
 */
async function purgeLegacySeededNotes() {
  try {
    const users = await all('SELECT id FROM users', []);
    const signatures = SAMPLE_NOTES.map((note) => ({ title: note.title, tags: note.tags }));
    let removedCount = 0;

    for (const user of users) {
      const rows = await all(
        'SELECT id, title, COALESCE(tags, "") as tags FROM notes WHERE user_id = ?',
        [user.id]
      );
      if (!rows.length) continue;

      const hasAllSampleNotes = signatures.every((signature) =>
        rows.some((row) => row.title === signature.title && row.tags === signature.tags)
      );
      if (!hasAllSampleNotes) continue;

      for (const signature of signatures) {
        const result = await run(
          'DELETE FROM notes WHERE user_id = ? AND title = ? AND COALESCE(tags, "") = ?',
          [user.id, signature.title, signature.tags]
        );
        removedCount += result.changes || 0;
      }
    }

    if (removedCount > 0) {
      console.log(`[StudyPal] Removed ${removedCount} legacy seeded notes`);
    }

    return removedCount;
  } catch (err) {
    console.error('[StudyPal] Error purging legacy seeded notes:', err.message);
    return 0;
  }
}

/**
 * Get all sample notes (useful for API endpoints)
 * @returns {Array} - Array of sample notes
 */
function getSampleNotes() {
  return SAMPLE_NOTES;
}

module.exports = {
  seedNotesIfEmpty,
  seedNotesGlobally,
  purgeLegacySeededNotes,
  getSampleNotes
};
