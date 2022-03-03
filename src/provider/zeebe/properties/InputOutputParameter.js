import {
  getBusinessObject,
  is
} from 'bpmn-js/lib/util/ModelUtil';

import { TextFieldEntry } from '@bpmn-io/properties-panel';

import {
  useService
} from '../../../hooks';

import { getPath } from '@philippfromme/moddle-helpers';


export default function InputOutputParameter(props) {
  const {
    element,
    idPrefix,
    parameter
  } = props;

  const businessObject = getBusinessObject(element);

  const entries = [
    {
      id: idPrefix + '-target',
      path: [ ...getPath(parameter, businessObject), 'target' ],
      component: TargetProperty,
      parameter
    },
    {
      id: idPrefix + '-source',
      path: [ ...getPath(parameter, businessObject), 'source' ],
      component: SourceProperty,
      parameter
    }
  ];

  return entries;
}

function TargetProperty(props) {
  const {
    element,
    id,
    path,
    parameter
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: parameter,
      properties: {
        target: value
      }
    });
  };

  const getValue = (parameter) => {
    return parameter.target;
  };

  return TextFieldEntry({
    element: parameter,
    id,
    path,
    label: translate((is(parameter, 'zeebe:Input') ? 'Local variable name' : 'Process variable name')),
    getValue,
    setValue,
    debounce
  });
}

function SourceProperty(props) {
  const {
    element,
    id,
    path,
    parameter
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: parameter,
      properties: {
        source: value
      }
    });
  };

  const getValue = (parameter) => {
    return parameter.source;
  };

  return TextFieldEntry({
    element: parameter,
    id,
    path,
    label: translate('Variable assignment value'),
    getValue,
    setValue,
    debounce
  });
}