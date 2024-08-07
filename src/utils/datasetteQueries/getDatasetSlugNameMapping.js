import datasette from '../../services/datasette.js'

export const getDatasetSlugNameMapping = async () => {
  const datasetSlugNameTable = await datasette.runQuery('select dataset, name from dataset')

  const datasetMapping = new Map()
  datasetSlugNameTable.rows.forEach(([slug, name]) => {
    datasetMapping.set(slug, name)
  })
  return datasetMapping
}
