
let canvas = document.getElementById('canvas')
let ctx = canvas.getContext('2d')
canvas.width = 600
canvas.height = 600
let w = canvas.width
let h = canvas.height

let board = document.getElementById('board')
let leftDrop = document.getElementsByClassName('dropNumber')[0]
let level = document.getElementsByClassName('level')[0]
let status = document.getElementsByClassName('status')[0]
let restart = document.getElementsByClassName('restart')[0]

let degreeMap = [
  { a: 0, b: 0 }, 
  { a: 15, b: 20 },
  { a: 30, b: 30 },
  { a: 45, b: 35 },
  { a: 50, b: 50 },
  { a: 10, b: 10}, // 爆裂之后的小水滴
  { a: 0, b: 0 } // 爆裂之后不存在了
]

let game = null

// 均匀压缩法
function EllipseOne(ctx, x, y, a, b, fillStyle) {
  ctx.save()
  ctx.fillStyle = fillStyle || game.color
  let r = (a > b) ? a : b
  let ratioX = a / r
  let ratioY = b / r
  ctx.scale(ratioX, ratioY)
  ctx.beginPath()
  ctx.arc(x / ratioX, y / ratioY, r, 0, 2 * Math.PI, false)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function clearRect(x, y, r) {
  ctx.clearRect(x - r / 2, y - r / 2, r, r)
}

class Drop {
  constructor(x, y, degree, direction) {
    this.x = x
    this.y = y
    this.degree = degree || 1
    this.direction = direction || null
  }

  draw(degree) {
    let { a, b } = degreeMap[degree]
    EllipseOne(ctx, this.x, this.y, a, b)
  }

  addDegree() {
    this.degree++
  }

  checkDegree() {
    if (this.degree < 4 && this.degree > 0) {
      this.addDegree()
      this.draw(this.degree)
    } else if (this.degree === 4) {
      this.bubblePop()
    }
  }

  bubblePop() {
    const { x, y } = this
    this.degree = 6 
    let drop_left = new Drop(x - 25, y, 5, 'left')
    let drop_up = new Drop(x, y - 25, 5, 'up')
    let drop_right = new Drop(x + 25, y, 5, 'right')
    let drop_down = new Drop(x, y + 25, 5, 'down')
    const interval = game.board.interval
    ctx.clearRect(x - interval / 2, y - interval / 2, interval, interval)
    drop_left.draw(drop_left.degree)
    drop_up.draw(drop_up.degree)
    drop_right.draw(drop_right.degree)
    drop_down.draw(drop_down.degree)

    game.brokenArr = game.brokenArr.concat([drop_left, drop_up, drop_right, drop_down])
  }

  ishit() {
    const { x, y } = this
    if (x < 0 || x > w || y < 0 || y > h) {
      return true
    }
    let dropArr = game.dropArr
    for (let i = 0; i < dropArr.length; i++) {
      if (x <= dropArr[i].x + 50 + 10 && x >= dropArr[i].x - 50 - 10 
        && y <= dropArr[i].y + 50 + 10 && y >= dropArr[i].y - 50 - 10) {
          // 290 410 || 490 610
          // 225 250 250 250
          // console.log('hit', i, x, y)
          if (dropArr[i].degree > 0 && dropArr[i].degree <= 4) {            
            if (dropArr[i].degree === 4) {
              dropArr[i].bubblePop()
            } else {
              dropArr[i].addDegree()
              dropArr[i].draw(dropArr[i].degree)
            }
            return true
          }
        }
    }
    return false
  }
}

class Board {
  constructor() {
    this.width = w
    this.height = h
    this.number = 6 // 水平竖直方格个数
    this.coordinate = [] // 存放水滴坐标数组
    this.interval = w / this.number
  }

  init() {
    game.brokenArr = []
    game.dropArr = []
    let { number, coordinate } = this
    const xInterval = w / number
    const yInterval = h / number
    let count = 0
    for (let j = 0; j < number; j++) {
      for (let i = 0; i < number; i++) {
        const item = {
          x: i * xInterval + xInterval / 2,
          y: j * yInterval + yInterval / 2
        }
        coordinate.push(item)
        let degree = getInteger(0, 4)
        let drop = new Drop(item.x, item.y)
        drop.degree = degree
        count++
        game.dropArr.push(drop)
        drop.draw(degree)
      }
    }
  }
}

class Game {
  constructor(color, leftDrop) {
    this.level = 1
    this.pause = false
    this.brokenArr = []
    this.dropArr = []
    this.board = null
    this.color = color || '#1BD369'
    this.leftDrop = 10 || leftDrop
    this.isCleared = false
  }

  init() {
    let board = new Board()
    board.init()
    this.board = board
    this.addClickEvent()
    this.animation()
  }

  addClickEvent() {
    let board = this.board
    
    restart.addEventListener('click', (e) => {
      this.restart()
    })

    canvas.addEventListener('click', (e) => {
      if (this.pause) return
      e.preventDefault()
      if (this.pause) {
        return 
      }

      const { offsetX, offsetY } = e
      const x = Math.floor(offsetX / board.interval)
      const y = Math.floor(offsetY / board.interval)
      let targetDrop = game.dropArr[x + y * board.number]

      if (targetDrop.degree > 0 && targetDrop.degree < 6) {
        this.leftDrop--
        leftDrop.innerHTML = this.leftDrop
      }

      targetDrop.checkDegree()
    })
  }

  bubblePopMove() {
    let brokenArr = game.brokenArr
    if (brokenArr.length === 0) return 
    for (let i = 0; i < brokenArr.length; i++) {
      if (!brokenArr[i].ishit()) {
        clearRect(brokenArr[i].x, brokenArr[i].y, 20)
        const { direction } = brokenArr[i]
        switch(direction) {
          case 'left':
            brokenArr[i].x--
            break
          case 'up':
            brokenArr[i].y--
            break
          case 'right':
            brokenArr[i].x++
            break
          case 'down':
            brokenArr[i].y++
            break
        }
        brokenArr[i].draw(5)
      } else {
        clearRect(brokenArr[i].x, brokenArr[i].y, 20)
        brokenArr.splice(i, 1)
      }
    }
  }

  isStageCleared() {
    for(let i = 0; i < game.dropArr.length; i++) {
      let drop = game.dropArr[i]
      let { degree } = drop
      // 为0就是空位置
      if (!(degree === 6 || degree === 0)) {
        this.isCleared = false
        return false
      }
    }
    this.pause = true    
    this.isCleared = true
    return true
  }

  animation() {
    if (this.leftDrop <= 0 && !this.pause) {
      this.lose()
    }
    if (this.isCleared && this.pause) {
      this.isCleared = false
      setTimeout(() => {
        clearTimeout(window.timerID)                
        this.nextStage()
      }, 2000) 
    }
    // level.innerHTML = `level ${this.level}`
    // leftDrop.innerHTML = this.leftDrop
    window.timerID = setTimeout(() => {
      clearTimeout(window.timerID)
      this.bubblePopMove()
      if (!this.isCleared && !this.pause) {
        this.isStageCleared()        
      }
      this.animation()
    }, 5)
  }

  nextStage() {
    clearRect(300, 300, 600, 600)
    status.innerHTML = 'Next stage!'
    this.pause = false
    this.level++
    level.innerHTML = `level ${this.level}`
    this.leftDrop += 5
    leftDrop.innerHTML = this.leftDrop

    game.init()
  }

  lose() {
    this.pause = true
    alert('You lose!')
    status.innerHTML = 'You lose!'
  }
  
  restart() {
    clearRect(300, 300, 600, 600)
    
    this.level = 1
    this.leftDrop = 10
    game.init()
    level.innerHTML = `level ${this.level}`
    leftDrop.innerHTML = this.leftDrop
  }
}

function getInteger(min, max) {
  let range = max - min
  return Math.round(Math.random() * range + min)
}

game = new Game()
game.init()