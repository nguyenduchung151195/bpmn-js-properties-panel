import {
  createInputParameter,
  ensureExtension
} from '../CreateHelper';


export default class CreateInputHandler {
  static create(element, options = {}) {
    const {
      property,
      bpmnFactory
    } = options;

    const {
      binding,
      value
    } = property;

    const ioMapping = ensureExtension(element, 'zeebe:IoMapping', bpmnFactory);

    // todo: if not optional
    const input = createInputParameter(binding, value, bpmnFactory);
    input.$parent = ioMapping;
    ioMapping.get('inputParameters').push(input);
  }

  static getBindingType() {
    return 'zeebe:input';
  }
}