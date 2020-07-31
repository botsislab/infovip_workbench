import * as d3 from 'd3v4'

export default class Tooltip {
  constructor (id, width) {
    this.tt = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .attr('id', id)
      .style('pointer-events', 'none')

    // Set a width if it is provided.
    if (width) {
      this.tt.style('width', width)
    }

    // Initially it is hidden.
    this.hide()
  }

  showDetail (d) {
    // change outline to indicate hover state.
    // d3.select(this).attr('stroke', 'black')

    var content = '<span class="name">Case ID: </span><span class="value">' +
      d.case_id +
      '</span><br/>' +
      '<span class="name">Sex: </span><span class="value">' +
      d.sex +
      '</span><br/>' +
      '<span class="name">Age: </span><span class="value">' +
      d.age_in_years +
      '</span><br/>' +
      '<span class="name">All Outcomes: </span><span class="value">' +
      d.all_outcomes +
      '</span><br/>' +
      '<span class="name">Report Source: </span><span class="value">' +
      d.report_source +
      '</span><br/>' +
      '<span class="name">PTs: </span><span class="value">' +
      d.all_pts +
      '</span><br/>'

    this.show(content, d3.event)
  }

  /*
  * Display tooltip with provided content.
  *
  * content is expected to be HTML string.
  *
  * event is d3.event for positioning.
  */
  show (content, event) {
    this.tt.style('opacity', 1.0)
      .html(content)

    this.updatePosition(event)
  }

  /*
  * Hide the tooltip div.
  */
  hide () {
    this.tt.style('opacity', 0.0)
  }

  /*
  * Figure out where to place the tooltip
  * based on d3 mouse event.
  */
  updatePosition (event) {
    var xOffset = 20
    var yOffset = 10

    var ttw = this.tt.style('width')
    var tth = this.tt.style('height')

    var wscrY = window.scrollY
    var wscrX = window.scrollX

    var curX = (document.all) ? event.clientX + wscrX : event.pageX
    var curY = (document.all) ? event.clientY + wscrY : event.pageY
    var ttleft = ((curX - wscrX + xOffset * 2 + ttw) > window.innerWidth)
      ? curX - ttw - xOffset * 2 : curX + xOffset

    if (ttleft < wscrX + xOffset) {
      ttleft = wscrX + xOffset
    }

    var tttop = ((curY - wscrY + yOffset * 2 + tth) > window.innerHeight)
      ? curY - tth - yOffset * 2 : curY + yOffset

    if (tttop < wscrY + yOffset) {
      tttop = curY + yOffset
    }

    this.tt
      .style('top', tttop + 'px')
      .style('left', ttleft + 'px')
  }
}
