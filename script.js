class Moveable {
    constructor(object_id) {
        this.object_id = object_id;
        this.element = document.getElementById(object_id);
    }

    moveAt(x, y) {
        this.element.style.left = x + 'px';
        this.element.style.top = y + 'px';
    }

    moveWith(offsetX, offsetY) {
        x = this.element.getBoundingClientRect().left + offsetX;
        y = this.element.getBoundingClientRect().top + offsetY;
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

        this.currentDroppable = null;
        this.inDroppable = false;

        this.onMouseMoveWithBind = this.onMouseMove.bind(this); //Мини костыль

        this.element.addEventListener("mousedown", this.mousedown.bind(this));
        this.element.addEventListener("mouseup", this.mouseup.bind(this));
        this.element.addEventListener("dragstart", this.dragstart);
    }

    onMouseMove(event) {
        this.moveWithCursorShift(event);

        this.element.hidden = true;
        let elemBelow = document.elementFromPoint(event.clientX, event.clientY);
        this.element.hidden = false;

        if (!elemBelow) return;

        let droppableBelow = elemBelow.closest('.dot');
        if (this.currentDroppable != droppableBelow) {
            if (this.currentDroppable) { // null если мы были не над droppable до этого события
                // (например, над пустым пространством)
                this.leaveDroppable(this.currentDroppable);
            }

            this.currentDroppable = droppableBelow;
            if (this.currentDroppable) { // null если мы не над droppable сейчас, во время этого события
                // (например, только что покинули droppable)
                this.enterDroppable(this.currentDroppable);
            }
        }
    }

    mousedown(event) {
        this.shiftX = event.clientX - this.element.getBoundingClientRect().left;
        this.shiftY = event.clientY - this.element.getBoundingClientRect().top;

        this.element.style.position = 'absolute';
        this.element.style.zIndex = 1000;
        document.body.append(this.element);

        this.moveWithCursorShift(event);

        document.addEventListener('mousemove', this.onMouseMoveWithBind, true);
    }

    dragstart(event) {
        event.preventDefault();
    }

    mouseup(_event) {
        document.removeEventListener('mousemove', this.onMouseMoveWithBind, true);

        if (this.inDroppable) {
            let boundingRect = this.currentDroppable.getBoundingClientRect();
            this.moveToCenter(boundingRect.left + boundingRect.width / 2, boundingRect.top + boundingRect.height / 2);
        }
    }

    moveWithCursorShift(event) {
        this.moveAt(event.pageX - this.shiftX, event.pageY - this.shiftY);
    }

    enterDroppable(elem) {
        elem.style.background = 'pink';
        this.inDroppable = true;
    }

    leaveDroppable(elem) {
        elem.style.background = '';
        this.inDroppable = false;
    }

}

class DragPoint extends Draggable {}

class DropPoint extends Moveable {}

class PartPicture extends Moveable {
    constructor(object_id) {
        super(object_id)
    }

    getLeftPointX() {
        return this.element.getBoundingClientRect().left;
    }

    getRightPointX() {
        return this.element.getBoundingClientRect().right;
    }

    getPointY() {
        return this.element.getBoundingClientRect().top + this.element.getBoundingClientRect().height / 2;
    }
}

class DragPointWithFilter extends DragPoint {
    constructor(object_id, color) {
        super(object_id);
        this.color = color;
    }

    enterDroppable(elem) {
        if (elem.classList.contains(this.color))
            super.enterDroppable(elem)
    }
}


class Part {
    constructor(partName) {
        this.partName = partName;

        this.dotId = "dot_" + partName;
        this.circleId = "circle_" + partName;
        this.partPictureId = "partPicture_" + partName;

        let dotHtml = '<img src="graphics/dot_blue.png" id="' + this.dotId + '" class="dot blue">';
        let circleHtml = '<img src="graphics/circle_blue.png" id="' + this.circleId + '" class="circle blue">';
        let partPictureHtml = '<img src="graphics/' + partName + '.png" id="' + this.partPictureId + '" class="partPicture">';
        this.createHtmlElement(dotHtml);
        this.createHtmlElement(circleHtml);
        this.createHtmlElement(partPictureHtml);

        this.dot = new DropPoint(this.dotId)
        this.circle = new DragPoint(this.circleId);
        this.part = new PartPicture(this.partPictureId);

        this.part.moveAt(200, 200);

        this.dot.moveToCenter(this.part.getLeftPointX(), this.part.getPointY());
        this.circle.moveToCenter(this.part.getRightPointX(), this.part.getPointY());
        this.foo();
    }

    foo() {}


    createHtmlElement(innerHTML) {
        let element = document.createElement('div');
        element.innerHTML = innerHTML;
        document.body.append(element);
    }
}

new Part("sidenie");