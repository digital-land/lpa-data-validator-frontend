import parse from 'wellknown'
import maplibregl from 'maplibre-gl'

class Map {
  constructor (containerId, rows, geometryKey) {
    this.map = new maplibregl.Map({
      container: containerId,
      style: 'https://api.maptiler.com/maps/basic-v2/style.json?key=ncAXR9XEn7JgHBLguAUw',
      zoom: 11
    })

    this.map.on('load', () => {
      this.addDataToMap(rows, geometryKey)
    })
  }

  addDataToMap (rows, geometryKey) {
    const geometries = []
    rows.forEach((row, index) => {
      const name = `geometry-${index}`

      // Convert the coordinates string to a GeoJSON object
      const geometry = parse(row[geometryKey])
      // store geometries for use in calculating the bbox later
      geometries.push(geometry)
      // add the source
      this.map.addSource(name, {
        type: 'geojson',
        data: geometry
      })

      const color = '#008'
      const lineColor = '#000000'

      // Add a layer to the map based on the geometry type
      if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
        this.map.addLayer({
          id: name,
          type: 'fill',
          source: name,
          layout: {},
          paint: {
            'fill-color': color,
            'fill-opacity': 0.4
          }
        })

        this.map.addLayer({
          id: name + '-border',
          type: 'line',
          source: name,
          layout: {},
          paint: {
            'line-color': lineColor,
            'line-width': 1
          }
        })
      } else if (geometry.type === 'Point' || geometry.type === 'MultiPoint') {
        this.map.addLayer({
          id: name,
          type: 'circle',
          source: name,
          paint: {
            'circle-radius': 10,
            'circle-color': color
          }
        })
      }
    })

    this.bbox = this.calculateBoundingBoxFromGeometries(geometries.map(g => g.coordinates))
    this.setMapViewToBoundingBox()
  }

  setMapViewToBoundingBox () {
    this.map.fitBounds(this.bbox, { padding: 20 })
  }

  moveMapToLocation (location) {
    this.map.flyTo({
      center: location,
      zoom: 11
    })
  }

  calculateBoundingBoxFromGeometries (geometries) {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    const pullOutCoordinates = (geometry) => {
      if (Array.isArray(geometry[0])) {
        geometry.forEach(pullOutCoordinates)
      } else {
        const [x, y] = geometry

        // if x or y isn't a valid number log an error and continue
        if (isNaN(x) || isNaN(y)) {
          console.error('Invalid coordinates', x, y)
          return
        }

        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }

    pullOutCoordinates(geometries)

    // Return the bounding box
    return [[minX, minY], [maxX, maxY]]
  }
}

const createMapFromServerContext = () => {
  const { containerId, rows, geometryKey } = window.serverContext

  // if any of the required properties are missing, return null
  if (!containerId || !rows || !geometryKey) {
    return null
  }

  return new Map(containerId, rows, geometryKey)
}

const newMap = createMapFromServerContext()

window.map = newMap
