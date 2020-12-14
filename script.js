class Moveable {
    constructor(object_id) {
        this.object_id = object_id
        this.element = document.getElementById(object_id)
    }

    getX() {
        return this.element.getBoundingClientRect().left
    }

    getY() {
        return this.element.getBoundingClientRect().top
    }

    moveAt(x, y) {
        this.element.style.left = x + 'px'
        this.element.style.top = y + 'px'
    }

    moveWith(offsetX, offsetY) {
        let x = this.element.getBoundingClientRect().left - offsetX
        let y = this.element.getBoundingClientRect().top - offsetY
        this.moveAt(x, y)
    }

    moveToCenter(pageX, pageY) {
        let x = pageX - (this.element.getBoundingClientRect().width / 2)
        let y = pageY - (this.element.getBoundingClientRect().height / 2)
        this.moveAt(x, y)
    }
}

class Draggable extends Moveable {
    constructor(object_id) {
        super(object_id)

        this.currentDroppable = null
        this.inDroppable = false

        this.onMouseMoveWithBind = this.onMouseMove.bind(this) //Мини костыль

        this.element.addEventListener("mousedown", this.mousedown.bind(this))
        this.element.addEventListener("mouseup", this.mouseup.bind(this))
        this.element.addEventListener("dragstart", this.dragstart)
    }

    onMouseMove(event) {
        this.moveWithCursorShift(event)

        this.element.hidden = true
        let elemBelow = document.elementFromPoint(event.clientX, event.clientY)
        this.element.hidden = false

        if (!elemBelow) return

        let droppableBelow = elemBelow.closest('.dot')
        if (this.currentDroppable != droppableBelow) {
            if (this.currentDroppable) { // null если мы были не над droppable до этого события
                // (например, над пустым пространством)
                this.leaveDroppable(this.currentDroppable)
            }

            this.currentDroppable = droppableBelow


            if (this.currentDroppable) { // null если мы не над droppable сейчас, во время этого события
                // (например, только что покинули droppable)
                this.enterDroppable(this.currentDroppable)
            }
        }
    }

    mousedown(event) {
        this.shiftX = event.clientX - this.element.getBoundingClientRect().left
        this.shiftY = event.clientY - this.element.getBoundingClientRect().top

        this.element.style.position = 'absolute'
        this.element.style.zIndex = 1000
        document.body.append(this.element)

        this.moveWithCursorShift(event)

        document.addEventListener('mousemove', this.onMouseMoveWithBind, true)
    }

    dragstart(event) {
        event.preventDefault()
    }

    mouseup() {
        document.removeEventListener('mousemove', this.onMouseMoveWithBind, true)

        if (this.inDroppable) {
            this.attachedToDroppable()
        }
    }

    moveWithCursorShift(event) {
        this.moveAt(event.pageX - this.shiftX, event.pageY - this.shiftY)
    }

    enterDroppable(elem) {
        elem.style.background = 'pink'
        this.inDroppable = true
    }

    leaveDroppable(elem) {
        elem.style.background = ''
        this.inDroppable = false

        if (this.isAttachedToDroppable)
            this.detachedFromDroppable()
    }

    attachedToDroppable() {
        this.isAttachedToDroppable = true

        let boundingRect = this.currentDroppable.getBoundingClientRect()
        this.moveToCenter(boundingRect.left + boundingRect.width / 2, boundingRect.top + boundingRect.height / 2)
    }

    detachedFromDroppable() {
        this.isAttachedToDroppable = false
    }

}

class DragPoint extends Draggable {
    constructor(object_id, part) {
        super(object_id)

        this.attachedPart = part
    }

    moveAt(x, y) {
        let oldX = this.getX()
        let oldY = this.getY()

        super.moveAt(x, y)

        this.element.dispatchEvent(new CustomEvent("circleMoved", {
            detail: { shiftX: oldX - this.getX(), shiftY: oldY - this.getY() }
        }))
    }

    moveWith(offsetX, offsetY) { //moveWith переопределён для того, чтобы не вызывать event
        let x = this.element.getBoundingClientRect().left - offsetX
        let y = this.element.getBoundingClientRect().top - offsetY

        this.element.style.left = x + 'px'
        this.element.style.top = y + 'px'
    }

    // moveWithCursorShift(event) {
    //     let oldX = this.getX()
    //     let oldY = this.getY()

    //     super.moveWithCursorShift(event)

    //     this.element.dispatchEvent(new CustomEvent("circleMoved", {
    //         detail: { shiftX: oldX - this.getX(), shiftY: oldY - this.getY() }
    //     }))
    // }

    attachedToDroppable() {
        super.attachedToDroppable()

        this.currentDroppable.dispatchEvent(new CustomEvent("dotConnected", {
            detail: { part: this.attachedPart }
        }))
    }

    detachedFromDroppable() {
        super.detachedFromDroppable()

        this.currentDroppable.dispatchEvent(new CustomEvent("dotDisconnected", {
            detail: { part: this.attachedPart }
        }))
    }
}

class DropPoint extends Moveable {}

class PartPicture extends Moveable {

    getLeftPointX() {
        return this.element.getBoundingClientRect().left
    }

    getRightPointX() {
        return this.element.getBoundingClientRect().right
    }

    getPointY() {
        return this.element.getBoundingClientRect().top + this.element.getBoundingClientRect().height / 2
    }
}

class DragPointWithFilter extends DragPoint {
    constructor(object_id, part, color) {
        super(object_id, part)
        this.color = color
    }

    enterDroppable(elem) {
        if (elem.classList.contains(this.color))
            super.enterDroppable(elem)
    }
}

class Part {
    constructor(partName, assembly) {
        this.partName = partName
        this.assembly = null //Ссылка на связный список, в котором находится эта деталь

        this.next = null //Part является нодой связного списка
            // this.previous = null

        this.dotId = "dot_" + partName
        this.circleId = "circle_" + partName
        this.partPictureId = "partPicture_" + partName

        let dotHtml = '<img src="graphics/dot_blue.png" id="' + this.dotId + '" class="dot blue">'
        let circleHtml = '<img src="graphics/circle_blue.png" id="' + this.circleId + '" class="circle blue">'
        let partPictureHtml = '<img src="graphics/' + partName + '.png" id="' + this.partPictureId + '" class="partPicture">'
        this.createHtmlElement(dotHtml)
        this.createHtmlElement(circleHtml)
        this.createHtmlElement(partPictureHtml)

        this.dot = new DropPoint(this.dotId)
        this.circle = new DragPoint(this.circleId, this)
        this.part = new PartPicture(this.partPictureId)

        this.part.moveAt(200, 200)

        this.dot.moveToCenter(this.part.getLeftPointX(), this.part.getPointY())
        this.circle.moveToCenter(this.part.getRightPointX(), this.part.getPointY())

        this.circle.element.addEventListener("circleMoved", this.onCircleMove.bind(this))
        this.dot.element.addEventListener("dotConnected", this.onDotConnencted.bind(this))
        this.dot.element.addEventListener("dotDisconnected", this.onDotDisconnected.bind(this))
    }

    onCircleMove(event) {
        let shiftX = event.detail.shiftX
        let shiftY = event.detail.shiftY

        this.dot.moveWith(shiftX, shiftY)
        this.part.moveWith(shiftX, shiftY)
        if (!this.next)
            this.assembly.onPartMove(shiftX, shiftY, this) //Можно было бы реализовать через ивенты, но не вижу в этом смысла
    }

    onAssemblyMove(shiftX, shiftY) {
        this.circle.moveWith(shiftX, shiftY)
        this.dot.moveWith(shiftX, shiftY)
        this.part.moveWith(shiftX, shiftY)
    }

    onDotConnencted(event) {
        let previous = event.detail.part
            // event.detail.part.next = this

        // event.detail.part.assembly.merge(this.assembly)

        let newAssembly = Assembly.merge(previous.assembly, this.assembly)

        this.assembly = newAssembly
        previous.assembly = newAssembly

        console.log(this.assembly)
    }

    onDotDisconnected(event) {
        let eventPart = event.detail.part //TODO нормально тут всё назвать

        let newAssembly = new Assembly()
        newAssembly.copyBefore(eventPart.assembly, eventPart)
        eventPart.assembly = newAssembly

        // this.assembly.removeBefore(eventPart)
    }

    createHtmlElement(innerHTML) {
        let element = document.createElement('div')
        element.innerHTML = innerHTML
        document.body.append(element)
    }
}

class Assembly { //Doubly linked list
    constructor() {
        this.head = null
        this.debugId = Math.floor(Math.random() * 1001)
    }

    static createOnePartAssembly(partName) { //Я абсолютно не уверен, можно ли использовать так статические методы, но это мой код!!! Что хочу то и делаю!!!    
        let assembly = new Assembly()

        let part = new Part(partName)

        assembly.addToTheEnd(part)
        return assembly
    }

    onPartMove(shiftX, shiftY, movedPart) {
        let current = this.head

        while (current) {
            if (current != movedPart) {
                current.onAssemblyMove(shiftX, shiftY)
            }

            current = current.next
        }
    }

    addToTheEnd(part) {
        part.assembly = this

        if (!this.head) {
            this.head = part
            part.next = null
        } else {
            let current = this.head

            while (current.next) {
                current = current.next
            }

            current.next = part
            part.next = null
        }
    }

    static merge(firstAssembly, secondAssembly) { //Превращает LinkedList в один, firsAssembly находится в начале новго LinkedList
        let newAssembly = new Assembly()

        let current = firstAssembly.head

        while (current) { //Добавляем первый LinkedList
            let tempNext = current.next //В процессе addToTheEnd ссылка на следующий элемент стирается, поэтому храним её здесь
            newAssembly.addToTheEnd(current)
            current = tempNext
        }

        current = secondAssembly.head

        while (current) { //Добавляем второй LinkedList
            newAssembly.addToTheEnd(current)
            current = current.next
        }

        return newAssembly
    }

    copyBefore(assembly, part) { //Перемещает linked list до элемента включительно
        let current = assembly.head

        while (current) {
            assembly.head = current.next
            this.addToTheEnd(current)

            if (current === part)
                break

            current = current.next
        }

    }

    removeBefore(part) { //Удаляет элементы из linked list до элемента включительно
        let current = this.head
        let previous = null

        while (current != part && current) {
            previous = current
            current = current.next
        }

        this.head = current.next

        console.log(this.getLength())
    }

    getLength() {
        let current = this.head
        let length = 0;

        while (current) {
            current = current.next
            length++;
        }

        return length
    }
}

// let sidenie = new Part("sidenie")
// let podlokotnik = new Part("podlokotnik_big_left")

// var assembly = new Assembly()
// assembly.addToTheEnd(sidenie)

// var assembly2 = new Assembly()
// assembly2.addToTheEnd(podlokotnik)
Assembly.createOnePartAssembly("sidenie")
Assembly.createOnePartAssembly("podlokotnik_big_left")
Assembly.createOnePartAssembly("podlokotnik_thin_right")