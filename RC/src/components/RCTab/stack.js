class Stack {
  constructor(container, { maxSize, selfResize }) {
    // set default max size if not provided
    if (isNaN(maxSize)) maxSize = 10;
    this._selfResize = selfResize;
    this._maxSize = maxSize;
    this._container = container || [];
  }

  // check container content
  display() {
    return this._container;
  }

  // check if container empty
  isEmpty() {
    return this._container.length === 0;
  }

  // check if container full
  isFull() {
    return this._container.length >= this._maxSize;
  }

  add(element) {
    if (this.isFull()) {
      if (!this._selfResize) {
        console.error("Stack overflow");
      } else {
        this._container.shift();
        this._container.push(element);
      }
    } else {
      this._container.push(element);
    }
  }

  remove() {
    if (this.isEmpty()) {
      return;
    }

    this._container.pop();
  }

  peek() {
    if (this.isEmpty()) {
      return;
    }

    return this._container[this._container.length - 1];
  }
}

export default Stack;
