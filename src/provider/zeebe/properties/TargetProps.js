import {
  getBusinessObject,
  is
} from 'bpmn-js/lib/util/ModelUtil';

import {
  createElement
} from '../../../utils/ElementUtil';

import {
  getCalledElement,
  getProcessId
} from '../utils/CalledElementUtil.js';

import {
  useService
} from '../../../hooks';

import { TextFieldEntry, isTextFieldEntryEdited } from '@bpmn-io/properties-panel';


export function TargetProps(props) {
  const {
    element
  } = props;

  if (!is(element, 'bpmn:CallActivity')) {
    return [];
  }

  return [
    {
      id: 'targetProcessId',
      component: TargetProcessId,
      isEdited: isTextFieldEntryEdited
    }
  ];
}

function TargetProcessId(props) {
  const {
    element
  } = props;

  const commandStack = useService('commandStack'),
        bpmnFactory = useService('bpmnFactory'),
        translate = useService('translate'),
        debounce = useService('debounceInput');

  const getValue = () => {
    return getProcessId(element);
  };

  const setValue = (value) => {
    const commands = [];

    const businessObject = getBusinessObject(element);

    // (1) ensure extension elements
    let extensionElements = businessObject.get('extensionElements');

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

    // (2) ensure zeebe:calledElement
    let calledElement = getCalledElement(businessObject);

    if (!calledElement) {
      calledElement = createElement(
        'zeebe:CalledElement',
        { },
        extensionElements,
        bpmnFactory);

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: extensionElements,
          properties: {
            values: [ ...extensionElements.get('values'), calledElement ]
          }
        }
      });

    }

    // (3) Update processId attribute
    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: calledElement,
        properties: {
          processId: value
        }
      }
    });

    // (4) Execute the commands
    commandStack.execute('properties-panel.multi-command-executor', commands);
  };

  return TextFieldEntry({
    element,
    id: 'targetProcessId',
    label: translate('Process ID'),
    getValue,
    setValue,
    debounce
  });
}
