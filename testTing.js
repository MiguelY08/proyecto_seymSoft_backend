import 'dotenv/config';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const KG = require('kg');

const apiKey = process.env.KNOWLEDGE_GRAPH_API_KEY;

assert.equal(typeof KG, 'function', 'La dependencia kg debe exportar una funcion constructora');

const knowledgeGraph = new KG(apiKey);

assert.equal(
  typeof knowledgeGraph.search,
  'function',
  'La instancia de kg debe exponer el metodo search'
);

console.log('Dependencia kg cargada correctamente.');

if (!apiKey) {
  console.log('No se ejecuto la consulta real porque falta KNOWLEDGE_GRAPH_API_KEY en .env.');
  console.log('Agrega KNOWLEDGE_GRAPH_API_KEY=\"tu_api_key\" y vuelve a correr: node testTing.js');
  process.exit(0);
}

knowledgeGraph.search({
  query: 'Taylor Swift',
  types: 'Person',
  limit: 1,
  callback(error, result) {
    if (error) {
      console.error('Error consultando Google Knowledge Graph:', error.message);
      process.exit(1);
    }

    const firstResult = result?.itemListElement?.[0]?.result;

    assert.ok(firstResult, 'La API debe devolver al menos un resultado');

    console.log('Consulta ejecutada correctamente.');
    console.log('Resultado:', firstResult.name);
  },
});
