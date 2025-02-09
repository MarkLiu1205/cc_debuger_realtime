<script setup>

/* these are necessary styles for vue flow */
import '@vue-flow/core/dist/style.css';

/* this contains the default theme, these are optional styles */
import '@vue-flow/core/dist/theme-default.css';

import { nextTick, ref } from 'vue'
import { Panel, VueFlow, useVueFlow } from '@vue-flow/core'
import { useLayout } from "../../../tools/dagre_auto_layout"

const position = { x: 0, y: 0 }

if (!Object.hasOwn) {
  Object.hasOwn = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
}

const initialNodes = [
  {
    id: '1',
    position,
    data: {
      label: 'Node 1',
    },
  },
  {
    id: '2',
    position,
    data: {
      label: 'Node 2',
    },
  },
  {
    id: '2a',
    position,
    data: {
      label: 'Node 2a',
    },
  },
  {
    id: '2b',
    position,
    data: {
      label: 'Node 2b',
    },
  },
  {
    id: '2c',
    position,
    data: {
      label: 'Node 2c',
    },
  },
  {
    id: '2d',
    position,
    data: {
      label: 'Node 2d',
    },
  },
  {
    id: '3',
    position,
    data: {
      label: 'Node 3',
    },
  },
  {
    id: '4',
    position,
    data: {
      label: 'Node 4',
    },
  },
  {
    id: '5',
    position,
    data: {
      label: 'Node 5',
    },
  },
  {
    id: '6',
    position,
    data: {
      label: 'Node 6',
    },
  },
  {
    id: '7',
    position,
    data: {
      label: 'Node 7',
    },
  },
]

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' },
  { id: 'e2-2a', source: '2', target: '2a' },
  { id: 'e2-2b', source: '2', target: '2b' },
  { id: 'e2-2c', source: '2', target: '2c' },
  { id: 'e2c-2d', source: '2c', target: '2d' },
  { id: 'e3-7', source: '3', target: '4' },
  { id: 'e4-5', source: '4', target: '5' },
  { id: 'e5-6', source: '5', target: '6' },
  { id: 'e5-7', source: '5', target: '7' },
]



const nodes = ref(initialNodes)

const edges = ref(initialEdges)

const { layout } = useLayout()

const { fitView } = useVueFlow()

async function layoutGraph(direction) {
  nodes.value = layout(nodes.value, edges.value, direction)

  nextTick(() => {
    fitView()
  })
}
</script>

<template>
  <div class="layout-flow">
    <VueFlow :nodes="nodes" :edges="edges" @nodes-initialized="layoutGraph('LR')">

      <Panel class="process-panel" position="top-right">
        <div class="layout-panel">
          <button title="set horizontal layout" @click="layoutGraph('LR')">
            <span >H</span>
          </button>

          <button title="set vertical layout" @click="layoutGraph('TB')">
            <span >V </span>
          </button>
        </div>
      </Panel>
    </VueFlow>
  </div>
</template>

<style>
.layout-flow {
  background-color: #1a192b;
  height: 100%;
  width: 100%;
}

.process-panel,
.layout-panel {
  display: flex;
  gap: 10px;
}

.process-panel {
  background-color: #2d3748;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.process-panel button {
  border: none;
  cursor: pointer;
  background-color: #4a5568;
  border-radius: 8px;
  color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.process-panel button {
  font-size: 16px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-panel {
  display: flex;
  align-items: center;
  gap: 10px;
}

.process-panel button:hover,
.layout-panel button:hover {
  background-color: #2563eb;
  transition: background-color 0.2s;
}

.process-panel label {
  color: white;
  font-size: 12px;
}

.stop-btn svg {
  display: none;
}

.stop-btn:hover svg {
  display: block;
}

.stop-btn:hover .spinner {
  display: none;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2563eb;
  border-radius: 50%;
  width: 10px;
  height: 10px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
