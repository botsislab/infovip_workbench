import * as d3 from 'd3v4'

// Adapted from http://bl.ocks.org/paradite/71869a0f30592ade5246
export default class SelectionRectangle {
  constructor (svg, selectables) {
    this.svg = svg
    this.element = null
    this.previousElement = null
    this.currentY = 0
    this.currentX = 0
    this.originX = 0
    this.originY = 0
    this.selectables = selectables
    this.selected = null
    this.dragBehavior = d3.drag()
      .on('drag', () => this.dragMove())
      .on('start', () => this.dragStart())
      .on('end', () => this.dragEnd())
    this.svg.call(this.dragBehavior)
  }

  getSelected () {
    return this.selected || []
  }

  setElement (element) {
    this.previousElement = this.element
    this.element = element
  }

  getNewAttributes () {
    var x = this.currentX < this.originX ? this.currentX : this.originX
    var y = this.currentY < this.originY ? this.currentY : this.originY
    var width = Math.abs(this.currentX - this.originX)
    var height = Math.abs(this.currentY - this.originY)
    return {
      x: x,
      y: y,
      width: width,
      height: height
    }
  }

  getCurrentAttributes () {
    // use plus sign to convert string into number
    var x = +this.element.attr('x')
    var y = +this.element.attr('y')
    var width = +this.element.attr('width')
    var height = +this.element.attr('height')
    return {
      x1: x,
      y1: y,
      x2: x + width,
      y2: y + height
    }
  }

  getCurrentAttributesAsText () {
    var attrs = this.getCurrentAttributes()
    return 'x1: ' + attrs.x1 + ' x2: ' + attrs.x2 + ' y1: ' + attrs.y1 + ' y2: ' + attrs.y2
  }

  init (newX, newY) {
    var rectElement = this.svg.append('rect')
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 0)
      .attr('height', 0)
      .classed('selection', true)
      .style('stroke', '#DE695B')
      .style('stroke-width', '2.5')
      .style('fill', 'none')
    this.setElement(rectElement)
    this.originX = newX
    this.originY = newY
    this.update(newX, newY)
  }

  update (newX, newY) {
    this.currentX = newX
    this.currentY = newY
    let newAttrs = this.getNewAttributes()
    this.element
      .attr('x', newAttrs.x)
      .attr('y', newAttrs.y)
      .attr('width', newAttrs.width)
      .attr('height', newAttrs.height)
  }

  focus () {
    this.element
      .style('stroke', '#DE695B')
      .style('stroke-width', '2.5')
      .style('fill', 'none')
  }

  remove () {
    this.clearSelection()
    this.removeRect()
  }

  removeRect () {
    if (this.element) {
      this.element.remove()
      this.element = null
    }
  }

  removePrevious () {
    if (this.previousElement) {
      this.previousElement.remove()
    }
  }

  dragStart () {
    let p = d3.mouse(this.svg.node())
    this.init(p[0], p[1])
    this.removePrevious()
  }

  dragMove () {
    let p = d3.mouse(this.svg.node())
    this.update(p[0], p[1])
    this.updateSelection(this.getCurrentAttributes())
  }

  dragEnd () {
    let finalAttributes = this.getCurrentAttributes()
    if (finalAttributes.x2 - finalAttributes.x1 > 1 && finalAttributes.y2 - finalAttributes.y1 > 1) {
      // Actual range selected
      d3.event.sourceEvent.preventDefault()
      this.focus()
    } else {
      // Single point
      this.remove()
    }
    // Hide rectangle
    this.removeRect()
  }

  updateSelection (rect) {
    // Highlight
    this.clearSelection()
    this.selected = this.selectables.filter(d => {
      return (
        d.x > rect.x1 &&
        d.y > rect.y1 &&
        d.x < rect.x2 &&
        d.y < rect.y2
      )
    })
    this.selected.classed('selected', true)
    // .attr('stroke.original', (d, i, selection) => selection[i].attributes['stroke'].value)
    // .attr('stroke', 'black')
    // .attr('fill.original', (d, i, selection) => selection[i].attributes['fill'].value)
    // .attr('fill', '#bada55')
  }

  clearSelection () {
    // Remove highlighting
    if (this.selected && this.selected.size() > 0) {
      this.selected.classed('selected', false)
      // .attr('stroke', (d, i, selection) => selection[i].attributes['stroke.original'].value)
      // .attr('fill', (d, i, selection) => selection[i].attributes['fill.original'].value)
      this.selected = null
    }
  }
}
