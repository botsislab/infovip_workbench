import * as d3 from 'd3v4'

export default class BubbleGroupsSimulation {
  constructor (graph, simulationConfig, height, width) {
    this.graph = graph
    this.config = simulationConfig
    this.height = height
    this.width = width
    this.center = { x: this.width / 2, y: this.height / 2 }
    this.isLinkSimulation = false
    this.simulation = d3.forceSimulation()
      .velocityDecay(this.config.velocityDecay)
      .on('tick', d => this.ticked(d))
      .stop()
  }

  setBubbles (bubbles) {
    this.bubbles = bubbles
  }

  setLinks (links) {
    this.links = links
  }

  ticked () {
    this.bubbles
      .attr('transform', d => {
        let x = Math.max(this.config.edgePadding, Math.min(this.width - this.config.edgePadding, d.x))
        let y = Math.max(this.config.minimumRadius, Math.min(this.height - this.config.edgePadding, d.y))
        return 'translate(' + x + ',' + y + ')'
      })
    this.links
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
  }

  setIsLinkSimulation (isLinkSimulation) {
    this.isLinkSimulation = isLinkSimulation
  }

  runSimulation (isSplit) {
    if (this.isLinkSimulation) {
      this.runLinkSimulation()
    } else {
      this.undoLinks()
      if (!isSplit) {
        this.combineBubbles()
      } else {
        this.splitBubbles()
      }
    }
  }

  undoLinks () {
    this.simulation.force('link', null)
    this.links.attr('stroke-width', 0)
    this.bubbles.selectAll('circle').transition()
      .duration(this.config.growDuration)
      .attr('r', d => d.radius)
  }

  combineBubbles () {
    this.config.onCombineBubbles()

    // @v4 Reset the 'x' force to draw the bubbles to the center.
    this.simulation
      .force('x', d3.forceX().strength(this.config.forceStrength).x(this.center.x))
      .force('y', d3.forceY().strength(this.config.forceStrength).y(this.center.y))
      .force('collisionForce', d3.forceCollide().radius(d => d.radius))
      .force('charge', d3.forceManyBody().strength(d => this.config.charge(d, this.config.forceStrength)))

    // @v4 We can reset the alpha value and restart the simulation
    this.simulation.nodes(this.graph.nodes).alpha(1).restart()
  }

  splitBubbles () {
    this.config.onSplitBubbles()

    // @v4 Reset the 'x' force to draw the bubbles to their group centers
    this.simulation
      .force('x', d3.forceX().strength(this.config.forceStrength * 1.5).x(this.config.getGroupX))
      .force('y', d3.forceY().strength(this.config.forceStrength).y(this.center.y))
      .force('collisionForce', d3.forceCollide().radius(d => d.radius))
      .force('charge', d3.forceManyBody().strength(d => this.config.charge(d, this.config.forceStrength)))

    // @v4 We can reset the alpha value and restart the simulation
    this.simulation.nodes(this.graph.nodes).alpha(2).restart()
  }

  runLinkSimulation () {
    this.bubbles.selectAll('circle').transition()
      .duration(this.config.growDuration)
      .attr('r', this.config.minimumRadius)
    this.links
      .attr('stroke-width', 2)
    this.simulation
      .force('link', d3.forceLink(this.graph.links).id(d => d.id).strength(link => {
        return 1 / (link.value * 3)
      }))
      .force('x', d3.forceX().x(this.center.x))// .strength(this.config.forceStrength).x(this.center.x))
      .force('y', d3.forceY().y(this.center.y))// .strength(this.config.forceStrength).y(this.center.y))
      .force('collisionForce', d3.forceCollide().radius(d => d.radius))
      .force('charge', d3.forceManyBody())// .strength(d => this.config.charge(d, this.config.forceStrength)))
    // TODO Should I set nodes here as well?
    this.simulation.alpha(2).restart()
  }
}
