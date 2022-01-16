import { CustomPriorityQueue } from '../timeline/CustomPriorityQueue'

test('', () => {
  const comparator = (n1: number, n2: number) => { return n2 - n1 }
  for (let i = 0; i < 10; i++) {
    const pq = new CustomPriorityQueue(comparator)

    for (let i = 0; i < 10000; i++) {
      const val = Math.floor(Math.random() * 50000)
      pq.add(Math.round(Math.random()) == 1 ? val : -val)
    }

    const arr = pq.toArray()
    for (let i = 1; i < arr.length; i++) {
      expect(comparator(arr[i-1], arr[i]) <= 0).toBe(true)
    }
  }
})
