import * as d3 from 'd3v4'
import * as palette from 'google-palette'
import seedrandom from 'seedrandom'

// Adapted from: http://vallandingham.me/bubble_chart_v4/#

/* bubbleChart creation function. Returns a function that will
 * instantiate a new bubble chart given a DOM element to display
 * it in and a dataset to visualize.
 *
 * Organization and style inspired by:
 * https://bost.ocks.org/mike/chart/
 *
 */
export default {
  bubbleChart (width) {
    // Constants for sizing
    let height = width

    // Locations to move bubbles towards
    let center = { x: width / 2, y: height / 2 }

    let tooltip = this.floatingTooltip('pt-bubbles-tooltip', 240)
    this.destroyTooltip = function () {
      tooltip.hideTooltip()
    }

    // These will be set in create_nodes and create_vis
    let svg = null
    let bubbles = null
    let circles = null
    let nodes = []
    let legendItems = null

    this.onPTMouseOver = function (ptObject) {
      let id = '#' + ptObject['pt'].toLowerCase().replace(/ /g, '_')
      let group = d3.select(id)
      group.raise()
      group.select('circle')
        .transition()
        .duration(300)
        .attr('r', d => {
          return width / 13
        })
        .attr('stroke', 'black')
    }

    this.onPTMouseOut = function (ptObject) {
      let id = '#' + ptObject['pt'].toLowerCase().replace(/ /g, '_')
      d3.select(id).select('circle')
        .transition()
        .duration(300)
        .attr('r', d => {
          return d.radius
        })
        .attr('stroke', d => d3.rgb(fillColor(d.outcome)).darker())
    }

    this.getLegendItems = function () {
      return legendItems
    }

    this.clear = function () {
      if (bubbles) bubbles.remove()
      // console.log(this.svg)
    }

    // @v4 strength to apply to the position forces
    const forceStrength = 0.03
    const collisionStrength = 0.9
    const alpha = 3
    const alphaDecay = 0.07
    const velocityDecay = 0.15
    const growDuration = 1500
    const growDelay = 0

    // const chargeStrength = -0.1

    // const forceStrength = 0.03
    // const collisionStrength = 0.9
    // const alpha = 3
    // const alphaDecay = 0.07
    // const velocityDecay = 0.2
    // const growDuration = 1500
    // const growDelay = 0
    // const headStartTicks = 50
    // const ticksInterval = 2
    // const ticksPerTick = 1

    // Charge function that is called for each node.
    // As part of the ManyBody force.
    // This is what creates the repulsion between nodes.
    //
    // Charge is proportional to the diameter of the
    // circle (which is stored in the radius attribute
    // of the circle's associated data.
    //
    // This is done to allow for accurate collision
    // detection with nodes of different sizes.
    //
    // Charge is negative because we want nodes to repel.
    // @v4 Before the charge was a stand-alone attribute
    //  of the force layout. Now we can use it as a separate force!
    function charge (d) {
      return -Math.pow(d.radius, 2.0) * forceStrength
      // return -d.radius * forceStrength
    }

    // Here we create a force layout and
    // @v4 We create a force simulation now and
    //  add forces to it.
    var simulation = d3.forceSimulation()
      .velocityDecay(velocityDecay)
      .force('x', d3.forceX().strength(forceStrength).x(center.x))
      .force('y', d3.forceY().strength(forceStrength).y(center.y))
      .force('collisionForce', d3.forceCollide().radius(d => d.radius + 2).strength(collisionStrength))
      .force('charge', d3.forceManyBody().strength(charge))
      .on('tick', ticked)
      .alpha(alpha)
      .alphaDecay(alphaDecay)
      .stop()

    // Nice looking colors - no reason to buck the trend
    // @v4 scales now have a flattened naming scheme
    var fillColor = null

    /*
    * This data manipulation function takes the raw data from
    * the CSV file and converts it into an array of node objects.
    * Each node will store data and visualization values to visualize
    * a bubble.
    *
    * rawData is expected to be an array of data objects, read in from
    * one of d3's loading functions like d3.csv.
    *
    * This function returns the new node array, with a node in that
    * array for each element in the rawData input.
    */
    function createNodes (rawData, minimumQuantity, outcome) {
      // Use the max total_amount in the data as the max in the scale's domain
      // note we have to ensure the total_amount is a number.
      let maxQuantity = d3.max(rawData, (d) => +d.quantity)
      let minQuantity = d3.min(rawData, (d) => +d.quantity)

      // TODO This filtering shouldn't happen once the data has been filtered
      let filteredData = rawData.filter(function (value) { return value.quantity >= minimumQuantity })

      // I want the circles to fit entirely in a width (i.e. diameter)-sized circle

      // I can calculate an "area" that the quantities would take up
      let quantities = filteredData.map(ptObject => ptObject.quantity)
      // console.log(quantities)

      // What is the largest I can make the values before they take up "too much" space

      // First, what is the limit?
      let containerArea = Math.PI * Math.pow((width / 2), 2) * 0.5
      // console.log('container: ' + containerArea)

      // What is the area taken up by the circles if their radius were equal to "quantity"?
      // let quantityArea = quantities.map(quantity => Math.PI * Math.pow(quantity, 2)).reduce((previous, current) => previous + current)
      // console.log(quantityArea)

      let haveCorrectScale = false
      let scaledMin = maxQuantity - minQuantity < 4 ? 10 : 1
      let scaledMax = 28
      let quantityScale = null
      let scaled = null

      while (!haveCorrectScale) {
        quantityScale = d3.scaleLinear()
          .domain([minQuantity, maxQuantity])
          .range([scaledMin, scaledMax])

        scaled = quantities.map(quantity => quantityScale(quantity))
        let quantityArea = scaled.map(quantity => Math.PI * Math.pow(quantity, 2)).reduce((previous, current) => previous + current)

        // console.log(quantityArea)

        if (quantityArea > containerArea) {
          haveCorrectScale = true
        } else {
          scaledMin += 0.7
          scaledMax += 1.1
        }
      }

      // Adjust range if the data is flat
      // if (minQuantity === maxQuantity && minQuantity === 1) range = [largestBubble - smallestBubble, largestBubble - smallestBubble]

      let colors = palette('cb-OrRd', 9).slice(0, -2).map(hex => '#' + hex)

      // Get range of outcome
      let maxOutcome = d3.max(filteredData, (d) => +d[outcome])

      fillColor = (outcome) => {
        if (outcome === 0) {
          return colors[0]
        } else {
          return d3.scaleQuantize().domain([0, maxOutcome]).range(colors)(outcome)
        }
      }

      legendItems = []

      let random = seedrandom('infovip')

      // Use map() to convert raw data into node data.
      // Checkout http://learnjsdata.com/ for more on
      // working with data.
      let myNodes = filteredData.map((d, index) => {
        let outcomeCount = +d[outcome]
        legendItems[outcomeCount] = {
          color: fillColor(outcomeCount),
          count: outcomeCount
        }
        let node = {
          id: index,
          radius: quantityScale(+d.quantity),
          value: +d.quantity,
          name: d.pt,
          outcome: outcomeCount,
          x: width * random(),
          y: height * random()
        }
        return node
      })

      return myNodes
    }

    /*
    * Main entry point to the bubble chart. This function is returned
    * by the parent closure. It prepares the rawData for visualization
    * and adds an svg element to the provided selector and starts the
    * visualization creation process.
    *
    * selector is expected to be a DOM element or CSS selector that
    * points to the parent element of the bubble chart. Inside this
    * element, the code will add the SVG continer for the visualization.
    *
    * rawData is expected to be an array of data objects as provided by
    * a d3 loading function like d3.csv.
    */
    this.initChart = function (selector, rawData, addFilterHandler, minimumQuantity, outcome) {
      // Setup tooltip
      tooltip.hideTooltip()
      tooltip.outcome = outcome

      // Remove previously existing chart if necessary
      d3.select(selector + ' svg').remove()
      tooltip.hideTooltip()

      // convert raw data into nodes data
      nodes = createNodes(rawData, minimumQuantity, outcome)

      // Create a SVG element inside the provided selector
      // with desired size.
      svg = d3.select(selector)
        .append('svg')
        .attr('width', width)
        .attr('height', height)

      // Bind nodes data to what will become DOM elements to represent them.
      bubbles = svg.selectAll('.bubble')
        .data(nodes, function (d) { return d.id })

      // Create new circle elements each with class `bubble`.
      // There will be one circle.bubble for each object in the nodes array.
      // Initially, their radius (r attribute) will be 0.
      // @v4 Selections are immutable, so lets capture the
      //  enter selection to apply our transtition to below.
      var bubblesE = bubbles.enter().append('g')
        .classed('bubble', true)
        .attr('id', d => d.name.toLowerCase().replace(/ /g, '_'))

      circles = bubblesE.append('circle')
        .attr('r', 0)
        .attr('fill', d => fillColor(d.outcome))
        .attr('stroke', d => d3.rgb(fillColor(d.outcome)).darker())
        .attr('stroke-width', 2)
        .on('mouseover', showDetail)
        .on('mouseout', hideDetail)
        .on('click', (d) => addFilterHandler(d.name))

      bubblesE.append('text')
        .text(d => camelize(d.name))
        .classed('bubble-title', true)
        .on('click', (d) => addFilterHandler(d.name))
        .call(wrap)
        .style('font-size', '0px')
        .transition()
        .duration(growDuration)
        .delay(growDelay)
        .style('font-size', '12px')

      function camelize (str) {
        let words = str.split(' ')
        words = words.map(function (word) {
          return word.charAt(0).toUpperCase() + word.toLowerCase().substr(1)
        })
        return words.join(' ')
      }

      // Inspiration: https://bl.ocks.org/mbostock/7555321
      function wrap (text) {
        text.each(function () {
          let text = d3.select(this)
          if (text.text() === '') return

          let words = text.text().split(/\s+/)
          let lineNumber = words.length * -0.5 - 1.2
          let lineHeight = 1.1 // ems
          let y = 12
          let dy = 0.1

          // Empty text element
          text.text(null)
          // let tspan = null
          let largest = 0

          // Add each word as a new tspan
          words.forEach(function (word) {
            // tspan = text.append('tspan').attr('x', 0).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word)
            text.append('tspan').attr('x', 0).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word)
            // let length = tspan.node().getComputedTextLength()
            let length = word.length * 6 // tspan.node().getComputedTextLength()
            if (length > largest) largest = length
          })

          // TODO If there's just one big word, trim off the end

          if (largest > text.data()[0].radius * 2) { // || text.data()[0].level === 'low') {
            // text.selectAll('*').classed('hidden', true)
            text.selectAll('*').remove()
          }
        })
      }

      // @v4 Merge the original empty selection and the enter selection
      bubbles = bubbles.merge(bubblesE)

      // Fancy transition to make bubbles appear, ending with the
      // correct radius
      circles.transition()
        .duration(growDuration)
        .delay(growDelay)
        .attr('r', function (d) { return d.radius })

      // bubbles.selectAll('tspan').transition()
      //   .duration(2000)
      //   .style('font-size', function(d) { return '12px' })

      // Set the simulation's nodes to our newly created nodes array.
      // @v4 Once we set the nodes, the simulation will start running automatically!
      simulation.nodes(nodes)

      // Set initial layout to single group.
      groupBubbles()
    }

    /*
    * Callback function that is called after every tick of the
    * force simulation.
    * Here we do the actual repositioning of the SVG circles
    * based on the current x and y values of their bound node data.
    * These x and y values are modified by the force simulation.
    */
    function ticked () {
      bubbles
        .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')' })
    }

    /*
    * Sets visualization in "single group mode".
    * The force layout tick function is set to move all nodes to the
    * center of the visualization.
    */
    function groupBubbles () {
      simulation
        // .force('x', d3.forceX().strength(forceStrength).x(center.x))
        .alpha(alpha)
        .alphaDecay(alphaDecay)
        // .restart()
      // // See https://github.com/d3/d3-force/blob/master/README.md#simulation_tick
      for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
        simulation.tick()
      }
      // simulation.restart()
      ticked()
    }

    /*
    * Function called on mouseover to display the
    * details of a bubble in the tooltip.
    */
    function showDetail (d) {
      // change outline to indicate hover state.
      d3.select(this).attr('stroke', 'black')

      var content = '<span class="title">' +
        d.name +
        '</span><br/>' +
        '<span class="name">Number of Reports: </span><span class="value">' +
        d.value +
        '</span><br/>' +
        '<span class="name">Reports with ' + tooltip.outcome + ': </span><span class="value">' +
        d.outcome +
        '</span><br/>'

      tooltip.showTooltip(content, d3.event)
    }

    /*
    * Hides tooltip
    */
    function hideDetail (d) {
      // reset outline
      d3.select(this)
        .attr('stroke', d3.rgb(fillColor(d.outcome)).darker())

      tooltip.hideTooltip()
    }

    return this
  },

  /*
  * Creates tooltip with provided id that
  * floats on top of visualization.
  * Most styling is expected to come from CSS
  * so check out bubble_chart.css for more details.
  */
  floatingTooltip (tooltipId, width, outcome) {
    // Local variable to hold tooltip div for
    // manipulation in other functions.
    d3.select('#' + tooltipId).remove()
    var tt = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .attr('id', tooltipId)
      .style('pointer-events', 'none')

    // Set a width if it is provided.
    if (width) {
      tt.style('width', width)
    }

    // Initially it is hidden.
    hideTooltip()

    /*
    * Display tooltip with provided content.
    *
    * content is expected to be HTML string.
    *
    * event is d3.event for positioning.
    */
    function showTooltip (content, event) {
      tt.style('opacity', 1.0)
        .html(content)

      updatePosition(event)
    }

    /*
    * Hide the tooltip div.
    */
    function hideTooltip () {
      tt.style('opacity', 0.0)
      tt.style('top', 0)
      tt.style('left', 0)
    }

    /*
    * Figure out where to place the tooltip
    * based on d3 mouse event.
    */
    function updatePosition (event) {
      var xOffset = 20
      var yOffset = 10

      var ttw = tt.style('width')
      var tth = tt.style('height')

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

      tt
        .style('top', tttop + 'px')
        .style('left', ttleft + 'px')
    }

    return {
      outcome: outcome,
      showTooltip: showTooltip,
      hideTooltip: hideTooltip,
      updatePosition: updatePosition
    }
  }
}
