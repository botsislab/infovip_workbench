import * as d3 from 'd3v4'
import * as palette from 'google-palette'
import SelectionRectangle from '@/util/SelectionRectangle'
import Tooltip from '@/util/Tooltip'
import BubbleGraph from '@/util/BubbleGraph'
import BubbleGroupsSimulation from '@/util/BubbleGroupsSimulation'

// Adapted from: http://vallandingham.me/bubble_chart_v4/#

export default class BubbleChart {
  constructor (selector, height, width, data, groupByField, shadeByField) {
    this.data = data
    this.selector = selector
    this.height = height
    this.width = width
    this.center = { x: this.width / 2, y: this.height / 2 }
    this.groupByField = groupByField
    this.shadeByField = shadeByField
    this.groupCenters = {}
    this.groupTitlesX = {}
    this.groupOptions = this.getGroupOptions(this.shadeByField)
    this.colors = palette('cb-OrRd', this.groupOptions.length).map(hex => '#' + hex)

    this.tooltip = new Tooltip('pt-bubbles-tooltip', 240)
    this.destroyTooltip = function () {
      this.tooltip.hide()
    }

    this.svg = null
    this.bubbles = null
    this.circles = null
    this.nodes = []
    this.graph = null

    this.minimumRadius = 10
    this.numTopValues = 20

    // @v4 strength to apply to the position forces
    this.shadeTransitionDuration = 500

    let simulationConfig = {
      forceStrength: 0.03,
      velocityDecay: 0.2,
      growDuration: 500,
      minimumRadius: this.minimumRadius,
      edgePadding: this.minimumRadius,
      charge: (d, strength) => -Math.pow(d.radius, 2.0) * strength,
      getGroupX: (d) => this.getGroupX(d),
      onCombineBubbles: () => this.onCombineBubbles(),
      onSplitBubbles: () => this.onSplitBubbles()
    }

    this.graph = new BubbleGraph(this.data, this.getGroupValue, this.height, this.width)
    this.simulation = new BubbleGroupsSimulation(this.graph, simulationConfig, this.height, this.width)
  }

  update () {
    // Hide tooltip
    this.tooltip.hide()

    // Remove previously existing chart if necessary
    d3.select(this.selector + ' svg').remove()
    this.tooltip.hide()

    // Create a SVG element inside the provided selector with desired size.
    this.svg = d3.select(this.selector)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .on('focus', () => {}) // Needed to limit keydown event to svg
      .on('keydown', () => this.onKeyDown())
      .on('click', (a, b, c) => {
        if (this.svg.node() === d3.event.target) {
          this.bubbles.classed('selected', false)
        }
      })

    this.links = this.svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(this.graph.links)
      .enter().append('line')
      .attr('stroke', '#aaa')

    this.simulation.setLinks(this.links)

    // Bind nodes data to what will become DOM elements to represent them.
    this.bubbles = this.svg.selectAll('.bubble')
      .data(this.graph.nodes, (d) => d.id)

    let bubblesE = this.bubbles.enter().append('g')
      .classed('bubble', true)
      .attr('fill', d => this.fillColor(d))
      .attr('stroke', d => this.getStroke(d))
      .attr('id', d => d.id)

    this.bubbles.exit().remove()

    this.circles = bubblesE.append('circle')
      .attr('r', 0)
      .attr('stroke-width', 2)
      .on('mouseover', d => this.tooltip.showDetail(d))
      .on('mouseout', () => this.tooltip.hide())

    this.selectionRectangle = new SelectionRectangle(this.svg, bubblesE)

    // @v4 Merge the original empty selection and the enter selection
    this.bubbles = this.bubbles.merge(bubblesE)
    this.simulation.setBubbles(this.bubbles)

    // Fancy transition to make bubbles appear, ending with the correct radius
    this.circles.transition()
      .attr('r', function (d) { return d.radius })
  }

  resetGraph () {
    this.groupByField = 'none'
    this.graph.reset()
    this.simulation.setIsLinkSimulation(false)
    this.update()
    this.runSimulation()
  }

  runSimulation () {
    this.simulation.runSimulation(this.groupByField !== 'none')
  }

  onKeyDown () {
    if (d3.event.key === 'Backspace') {
      let selected = this.svg.selectAll('.selected')
      if (selected) {
        let selectedIds = selected.nodes().map(node => parseInt(node.id))
        this.graph.nodes = this.graph.nodes.filter(node => selectedIds.indexOf(node.id) === -1)
        selected.remove()
        // this.update() TODO Is this needed?
        this.runSimulation()
      }
    }
  }

  onCombineBubbles () {
    this.hideGroupTitles()
  }

  onSplitBubbles () {
    this.showGroupTitles()
  }

  getStroke (d) {
    return d3.rgb(this.fillColor(d)).darker()
  }

  fillColor (d) {
    this.colorScale = d3.scaleOrdinal().domain(this.groupOptions).range(this.colors)
    let value = this.getGroupValue(d, this.shadeByField)
    return this.colorScale(value)
  }

  setShadeByField (shadeByField) {
    this.shadeByField = shadeByField
    this.groupOptions = this.getGroupOptions(this.shadeByField)
    this.colors = palette('cb-OrRd', this.groupOptions.length).map(hex => '#' + hex)
    // this.update()
    this.bubbles.transition()
      .duration(this.shadeTransitionDuration)
      .attr('fill', d => this.fillColor(d))
      .attr('stroke', d => this.getStroke(d))
  }

  shadeTopCounts (fieldName) {
    // Get top counts of field
    let topCounts = this.getTopCounts(this.graph.nodes, fieldName)
    this.colors = palette('tol-sq', this.numTopValues).map(hex => '#' + hex).reverse()
    topCounts['colors'] = this.colors
    this.bubbles.transition()
      .duration(this.shadeTransitionDuration)
      .attr('fill', d => this.topCountsFillColor(d, fieldName, topCounts))
    return topCounts
  }

  topCountsFillColor (d, fieldName, topCounts) {
    let color = 'white'
    for (let i = 0; i < topCounts.keys.length; i++) {
      let topCountKey = topCounts.keys[i]
      if (d[fieldName].indexOf(topCountKey) !== -1) {
        color = this.colors[topCounts.keys.indexOf(topCountKey)]
        break
      }
    }
    return color
  }

  getGroupX (d) {
    return this.groupCenters[d[this.groupByField]].x
  }

  setGroupByField (groupByField) {
    this.simulation.setIsLinkSimulation(false)
    this.groupCenters = {}
    this.groupTitlesX = {}
    this.groupByField = groupByField
    // Set group locations
    let groupOptions = this.getGroupOptions(this.groupByField)

    groupOptions.forEach((option, index) => {
      let numColumns = groupOptions.length
      let padding = 100
      let titlePadding = 20
      let columnWidth = (this.width - (padding * 2)) / numColumns
      let titleColumnWidth = (this.width - (titlePadding * 2)) / numColumns
      let x = padding + columnWidth / 2 + (columnWidth * index)
      let titleX = titlePadding + titleColumnWidth / 2 + (titleColumnWidth * index)
      this.groupCenters[option] = {
        x,
        y: this.height / 2
      }
      this.groupTitlesX[option] = titleX
    })

    this.runSimulation()
  }

  setGroupBySimilarityField (similarityGrouping) {
    // console.log('running link simulation')
    this.simulation.setIsLinkSimulation(true)
    this.hideGroupTitles()
    // Change to using links in force layout
    this.runSimulation()
  }

  removeSimilarityGrouping () {
    this.update()
    this.simulation.setIsLinkSimulation(true)
    this.runSimulation()
    // this.circles.transition()
    //   .attr('r', function (d) { return d.radius })
    // this.links
    //   .attr('stroke-width', 0)
    // this.simulation.force('link', null)
  }

  getTopCounts (elements, fieldName) {
    let values = []
    elements.map(d => values.push(...d[fieldName].split(/;|:/)))
    let uniqueValues = {}
    values.forEach(value => {
      uniqueValues[value] = 1 + (uniqueValues[value] || 0)
    })
    let sortable = []
    for (let key in uniqueValues) {
      sortable.push([key, uniqueValues[key]])
    }
    let topCounts = sortable.sort((a, b) => a[1] - b[1]).reverse().slice(0, this.numTopValues)
    let topKeys = topCounts.map(values => values[0])
    let topValues = topCounts.map(values => values[1])
    return {
      keys: topKeys,
      values: topValues
    }
  }

  setPTSearch (ptSearch) {
    // Remove highlighting
    this.clearPTSearch()

    // Highlight
    let matched = this.bubbles.filter(d => {
      return d.all_pts.toLowerCase().indexOf(ptSearch.toLowerCase()) !== -1
    })
    matched.classed('selected', true)
  }

  clearPTSearch () {
    // Remove highlighting
    this.bubbles.classed('selected', false)
  }

  getGroupOptions (group) {
    return [...new Set(this.data.map(report => this.getGroupValue(report, group)))]
  }

  getGroupValue (report, group) {
    let value = report[group]
    if (typeof value === 'undefined' || value === null) value = 'Other'
    if (group === 'report_source') {
      if (value.indexOf('HP') !== -1) {
        value = 'HP'
      } else {
        value = 'Other'
      }
    } else if (group === 'all_outcomes') {
      if (value.indexOf('DE') !== -1) {
        value = 'DE'
      } else if (value.indexOf('CA') !== -1) {
        value = 'CA'
      } else if (value.indexOf('HO') !== -1) {
        value = 'HO'
      } else {
        value = 'Other'
      }
    }
    return value
  }

  selectGroup (groupTitle) {
    this.bubbles.classed('selected', false)
    let group = this.bubbles.filter(bubble => bubble[this.groupByField] === groupTitle)
    group.classed('selected', true)
  }

  showGroupTitles () {
    this.hideGroupTitles()

    let groupTitleNames = d3.keys(this.groupTitlesX)
    let groupTitles = this.svg.selectAll('.grouptitle')
      .data(groupTitleNames)

    groupTitles.enter().append('text')
      .attr('class', 'grouptitle')
      .attr('x', d => this.groupTitlesX[d])
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('cursor', 'pointer')
      .text(title => title + ' (' + this.bubbles.filter(bubble => bubble[this.groupByField] === title).size() + ')')
      .on('click', title => {
        this.selectGroup(title)
      })
  }

  hideGroupTitles () {
    d3.selectAll('.grouptitle').remove()
  }
}
