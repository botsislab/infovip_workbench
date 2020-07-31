
export default {

  getGroupedCounts (dataArray, groupBy) {
    let groupedCounts = {}

    dataArray.forEach(function (value) {
      let key = value[groupBy]

      if (!(key in groupedCounts)) {
        groupedCounts[key] = 1
      } else {
        groupedCounts[key]++
      }
    })

    return groupedCounts
  },

  mapToObjectValues (object, callback) {
    let toReturn = {}

    for (let key in object) {
      toReturn[key] = callback(object[key], object)
    }

    return toReturn
  }
}
