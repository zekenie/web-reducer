"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
class VMInput {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10000)
], VMInput.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsJSON)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100 * 1000)
], VMInput.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsJSON)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100 * 1000)
], VMInput.prototype, "event", void 0);
exports.default = VMInput;
