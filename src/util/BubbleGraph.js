import * as d3 from 'd3v4'
import seedrandom from 'seedrandom'

export default class BubbleGraph {
  constructor (data, getGroupValue, height, width) {
    this.data = data
    this.getGroupValue = getGroupValue
    this.height = height
    this.width = width
  }

  reset () {
    this.constructGraph()
  }

  sizeValue (d) {
    // return d.all_outcomes ? d.all_outcomes.split(/;|:/).length : 0
    // return d.all_pts.split(/;|:/).length
    return d.age_in_years
  }

  constructGraph () {
    let maxAmount = Math.max(...this.data.map(report => this.sizeValue(report)))
    let radiusScale = d3.scalePow()
      .exponent(0.5)
      .range([5, 20])
      .domain([0, maxAmount])

    let pts = []

    let random = seedrandom('infovip')
    let nodes = this.data.map((d, index) => {
      pts.push(...d.all_pts.split(/;|:/))
      let node = Object.assign({}, d)
      node.id = index
      node.radius = radiusScale(this.sizeValue(d))
      node.radius = 12
      node.report_source = this.getGroupValue(d, 'report_source')
      node.all_outcomes = this.getGroupValue(d, 'all_outcomes')
      node.x = this.width * random()
      node.y = this.height * random()
      return node
    })
    let uniquePTs = {}
    pts.forEach(pt => {
      uniquePTs[pt] = 1 + (uniquePTs[pt] || 0)
    })
    let links = []
    nodes.forEach(node => {
      // For each PT at this node, add a link to any other node with the same PT
      let pts = node.all_pts.split(/;|:/)
      pts.forEach(pt => {
        nodes.filter(otherNode => {
          return (
            otherNode.all_pts.indexOf(pt) !== -1 &&
            otherNode.id !== node.id
          )
        })
          .map(targetNode => {
            links.push({
              source: node.id,
              target: targetNode.id
            })
          })
      })
    })
    let pruned = []
    links.forEach(focus => {
      let connections = links.filter(link => {
        return (
          (focus.source === link.source && focus.target === link.target) ||
          (focus.source === link.target && focus.target === link.source)
        )
      })
      if (connections.length > 2) {
        focus.value = connections.length
        pruned.push(focus)
      }
    })

    this.nodes = nodes
    this.links = pruned
  }
}
