// Test file for semicolon fix verification
const testArray = [
  'item1',
  'item2',
  'item3'
]

const testObject = {
  prop1: 'value1',
  prop2: 'value2',
  prop3: 'value3'
}

// Promise.all with array
const promises = Promise.all([
  fetch('/api/test1'),
  fetch('/api/test2'),
  fetch('/api/test3')
])

// Method chaining
const result = someObject
  .method1()
  .method2()
  .method3()

// Statement that should get semicolon
const simpleVar = 'test'
return someValue