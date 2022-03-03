import {
  createOutputParameter,
  ensureExtension
} from '../CreateHelper';


export default class CreateOutputHandler {
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
    const output = createOutputParameter(binding, value, bpmnFactory);
    output.$parent = ioMapping;
    ioMapping.get('outputParameters').push(output);
  }

  static getBindingType() {
    return 'zeebe:output';
  }
}