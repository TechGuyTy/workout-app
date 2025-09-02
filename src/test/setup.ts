// import { beforeAll, afterEach, afterAll } from 'vitest'
// import { cleanup } from '@testing-library/react'

// // Cleanup after each test
// afterEach(() => {
//   cleanup()
// })

// // Mock IndexedDB for tests
// beforeAll(() => {
//   // Mock IndexedDB if not available
//   if (typeof indexedDB === 'undefined') {
//     // @ts-ignore
//     global.indexedDB = {
//       open: () => ({
//         result: {
//           createObjectStore: () => {},
//           transaction: () => ({
//             objectStore: () => ({
//               add: () => Promise.resolve(1),
//               get: () => Promise.resolve(null),
//               getAll: () => Promise.resolve([]),
//               put: () => Promise.resolve(1),
//               delete: () => Promise.resolve(),
//               clear: () => Promise.resolve(),
//               count: () => Promise.resolve(0),
//             }),
//           }),
//         },
//         onupgradeneeded: null,
//         onsuccess: null,
//         onerror: null,
//       }),
//     }
//   }
// })
