
export default {

  abbreviations: {
    'isr': 'ISR',
    'pt': 'PT',
    'llts': 'LLTs',
    'hlts': 'HLTs',
    'hlgts': 'HLGTs',
    'socs': 'SOCs',
    'nec': 'NEC',
    'qt': 'QT'
  },

  toTitleCase (str) {
    return str.toLowerCase().trim().replace('_', ' ').split(' ').map((word) => {
      if (word === '') {
        return ''
      } else if (word in this.abbreviations) {
        return this.abbreviations[word]
      } else {
        return word.replace(word[0], word[0].toUpperCase())
      }
    }).join(' ')
  },

  generateArticleQuery (products, ingredients, pts, hlts) {
    // .replace(/\(.*\)/, '').split(';')
    products = this.getCleanQueryComponentArray(products)
    ingredients = this.getCleanQueryComponentArray(ingredients)
    pts = this.getCleanQueryComponentArray(pts)
    hlts = this.getCleanQueryComponentArray(hlts)
    let query = ''
    let drugQueryComponent = ''
    // As long as some drug info exists, build a query
    if (products.length > 0 || ingredients.length > 0) {
      // Build the drug part of the query
      if (products.length > 0 && ingredients.length > 0) {
        drugQueryComponent = '(' + products.join(' OR ') + ' OR ' + ingredients.join(' OR ') + ')'
      } else {
        drugQueryComponent = '(' + products.join(' OR ') + ingredients.join(' OR ') + ')'
      }

      // Build the AE part of the query
      let aeQueryComponent = ''
      if (pts.length > 0 || hlts.length > 0) {
        if (pts.length > 0 && hlts.length > 0) {
          aeQueryComponent = '(' + pts.join(' OR ') + ' OR ' + hlts.join(' OR ') + ')'
        } else {
          aeQueryComponent = '(' + pts.join(' OR ') + ')'
        }

        // Use both drug and AE parts since we have them
        query = drugQueryComponent + ' AND ' + aeQueryComponent
      } else {
        // Use just the drug part if we don't have an AE part
        query = drugQueryComponent
      }
    }
    return query
  },

  getCleanQueryComponentArray (queryComponentString) {
    if (typeof queryComponentString === 'string') {
      return queryComponentString.replace(/\(.*\)/, '').replace('\\', ';').split(/;|:/).map(product => {
        if (product.indexOf(' ') !== -1) {
          return '"' + product + '"'
        } else {
          return product
        }
      })
    } else {
      return []
    }
  }
}
