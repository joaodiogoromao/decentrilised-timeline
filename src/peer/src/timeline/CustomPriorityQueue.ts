export type Comparator<T> = (a1: T, a2: T) => number

export class CustomPriorityQueue<T> {
  private data = Array<T>()
  private comparator: Comparator<T>

  constructor(comparator: Comparator<T>, data?: Array<T>) {
    this.comparator = comparator
    if (data) this.data = data
  }

  add(element: T) {
    if (this.data.length == 0) {
      this.data.push(element)
      return
    }

    if (this.comparator(element, this.data[0]) < 0) {
      this.data.unshift(element)
      return
    }

    let left = 0
    let right = this.data.length - 1

    while (left < right) {
      const mid = Math.floor((left + right) / 2)

      const compareResult = this.comparator(element, this.data[mid])

      if (compareResult < 0) right = mid - 1
      else left = mid + 1
    }

    if (this.comparator(element, this.data[left]) < 0)
      this.data.splice(left, 0, element)
    else this.data.splice(left + 1, 0, element)
  }

  at(idx: number) {
    return this.data[idx]
  }

  size() {
    return this.data.length
  }

  clear() {
    this.data = []
  }

  keepNElements(newSize: number): Array<T> {
    return this.data.splice(newSize)
  }

  toArray() {
    return this.data
  }
}
