import {
  getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

import { TextFieldEntry, isTextFieldEntryEdited } from '@bpmn-io/properties-panel';

import {
  getExtensionElementsList
} from '../../../utils/ExtensionElementsUtil';

import {
  createElement
} from '../../../utils/ElementUtil';

import {
  useService
} from '../../../hooks';

import {
  isZeebeServiceTask
} from '../utils/ZeebeServiceTaskUtil';

import { getPath } from '@philippfromme/moddle-helpers';


export function TaskDefinitionProps(props) {
  const {
    element
  } = props;

  if (!isZeebeServiceTask(element)) {
    return [];
  }

  const businessObject = getBusinessObject(element),
        taskDefinition = getTaskDefinition(element);

  return [
    {
      id: 'taskDefinitionType',
      path: taskDefinition ? [ ...getPath(taskDefinition, businessObject), 'type' ] : undefined,
      component: TaskDefinitionType,
      isEdited: isTextFieldEntryEdited
    },
    {
      id: 'taskDefinitionRetries',
      path: taskDefinition ? [ ...getPath(taskDefinition, businessObject), 'retries' ] : undefined,
      component: TaskDefinitionRetries,
      isEdited: isTextFieldEntryEdited
    }
  ];
}

function TaskDefinitionType(props) {
  const {
    element,
    id,
    path
  } = props;

  const commandStack = useService('commandStack');
  const bpmnFactory = useService('bpmnFactory');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    return (getTaskDefinition(element) || {}).type;
  };

  const setValue = (value) => {
    const commands = [];

    const businessObject = getBusinessObject(element);

    let extensionElements = businessObject.get('extensionElements');

    // (1) ensure extension elements
    if (!extensionElements) {
      extensionElements = createElement(
        'bpmn:ExtensionElements',
        { values: [] },
        businessObject,
        bpmnFactory
      );

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: businessObject,
          properties: { extensionElements }
        }
      });
    }

    // (2) ensure task definition
    let taskDefinition = getTaskDefinition(element);

    if (!taskDefinition) {
      taskDefinition = createElement(
        'zeebe:TaskDefinition',
        { },
        extensionElements,
        bpmnFactory
      );

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: extensionElements,
          properties: {
            values: [ ...extensionElements.get('values'), taskDefinition ]
          }
        }
      });
    }

    // (3) update task definition type
    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: taskDefinition,
        properties: { type: value }
      }
    });

    // (4) commit all updates
    commandStack.execute('properties-panel.multi-command-executor', commands);
  };

  return TextFieldEntry({
    element,
    id,
    path,
    label: translate('Type'),
    getValue,
    setValue,
    debounce
  });
}

function TaskDefinitionRetries(props) {
  const {
    element,
    id,
    path
  } = props;

  const commandStack = useService('commandStack');
  const bpmnFactory = useService('bpmnFactory');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    return (getTaskDefinition(element) || {}).retries;
  };

  const setValue = (value) => {
    let commands = [];

    const businessObject = getBusinessObject(element);

    let extensionElements = businessObject.get('extensionElements');

    // (1) ensure extension elements
    if (!extensionElements) {
      extensionElements = createElement(
        'bpmn:ExtensionElements',
        { values: [] },
        businessObject,
        bpmnFactory
      );

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: businessObject,
          properties: { extensionElements }
        }
      });
    }

    // (2) ensure task definition
    let taskDefinition = getTaskDefinition(element);

    if (!taskDefinition) {
      taskDefinition = createElement(
        'zeebe:TaskDefinition',
        { },
        extensionElements,
        bpmnFactory
      );

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: extensionElements,
          properties: {
            values: [ ...extensionElements.get('values'), taskDefinition ]
          }
        }
      });
    }

    // (3) update task definition retries
    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: taskDefinition,
        properties: { retries: value }
      }
    });

    commandStack.execute('properties-panel.multi-command-executor', commands);
  };

  return TextFieldEntry({
    element,
    id,
    path,
    label: translate('Retries'),
    getValue,
    setValue,
    debounce
  });
}


// helper ///////////////////////

function getTaskDefinition(element) {
  const businessObject = getBusinessObject(element);

  return getExtensionElementsList(businessObject, 'zeebe:TaskDefinition')[0];
}
