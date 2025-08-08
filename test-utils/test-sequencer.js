const Sequencer = require('@jest/test-sequencer').default

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Define test priority
    const getPriority = (test) => {
      const path = test.path

      // Unit tests first (fastest)
      if (path.includes('unit')) return 1
      
      // Integration tests second
      if (path.includes('integration')) return 2
      
      // API tests third
      if (path.includes('api')) return 3
      
      // E2E tests fourth (slowest)
      if (path.includes('e2e')) return 4
      
      // Performance tests last
      if (path.includes('performance')) return 5
      
      return 10 // Other tests
    }

    return tests.sort((a, b) => {
      const priorityDiff = getPriority(a) - getPriority(b)
      if (priorityDiff !== 0) return priorityDiff

      // Sort by file size (smaller files first)
      return a.duration - b.duration
    })
  }
}

module.exports = CustomSequencer