import { type Up } from '../../unpoly.js'
import { type PlainObject } from '../../unpoly/util.js'
import { type ConfigWith } from '../../unpoly/util/config.js'

/**
Options for the warning that up.migrate.renamedProperty() and up.migrate.removedProperty() print.
@internal
*/
export interface PropertyWarningOptions {
  label?: string
  warning?: string
}

/**
Options for up.migrate.removedProperty().
@internal
*/
export interface RemovedPropertyOptions<T> extends PropertyWarningOptions {
  // The initial value, set without a warning.
  value?: T
}

/**
Where to look for an old attribute: a selector, or a function that returns one.
@internal
*/
export type AttributeScope = string | (() => string)

/**
Options for up.migrate.transformAttribute().
@internal
*/
export interface TransformAttributeOptions {
  scope?: AttributeScope
}

/**
A function that up.migrate.transformAttribute() calls for each element that has the old attribute.
@internal
*/
export type AttributeTransformer = (element: Element, value: string) => void

/**
Options for up.migrate.renamedAttribute().
@internal
*/
export interface RenamedAttributeOptions extends TransformAttributeOptions {
  mapValue?: string | ((value: string) => string)
}

/**
Options for up.migrate.removedAttribute().
@internal
*/
export interface RemovedAttributeOptions extends TransformAttributeOptions {
  replacement?: string
}

/**
Options for up.migrate.fixKey(), which name the object with the old key in the warning.
@internal
*/
export interface FixKeyOptions {
  // What the object is, like 'render options' or 'up.layer.config.modal'.
  label?: string
  // Where the object comes from, like an origin element or a URL.
  detail?: unknown
}

/**
Settings for unpoly-migrate.
@internal
*/
export interface MigrateConfig {
  logLevel: 'error' | 'warn' | 'none'
}

// The keys unpoly-migrate adds to up.migrate, besides the hooks that core declares and calls.
declare module '../../unpoly/migrate_stub.js' {
  interface Migrate {
    config: ConfigWith<MigrateConfig>
    deprecated(deprecatedExpression: string, replacementExpression: string): void
    renamedNamespace(oldName: string, newName: keyof Up): void
    renamedProperty(object: object, oldKey: string, newKey: string, options?: PropertyWarningOptions): void
    // Returns a reference to the property's value, which a polyfill can read.
    removedProperty<T>(object: object, key: string, options?: RemovedPropertyOptions<T>): [T]
    defineThrowingProps(object: object, forbiddenPrototype: object, errorMessage: string): void
    transformAttribute(oldAttr: string, transformer: AttributeTransformer): void
    transformAttribute(oldAttr: string, options: TransformAttributeOptions, transformer: AttributeTransformer): void
    renamedAttribute(oldAttr: string, newAttr: string, options?: RenamedAttributeOptions): void
    removedAttribute(oldAttr: string, options?: RemovedAttributeOptions): void
    renamedEvent(oldType: string, newType: string): void
    removedEvent(type: string, replacementExpression?: string | null): void
    fixKey(object: PlainObject, oldKey: string, newKey: string, options?: FixKeyOptions): void
    warn(message: string, ...args: unknown[]): void
    // Added by other files of unpoly-migrate.
    targetMacro?(queryAttr: string, fixedResultAttrs: Record<string, string>, replacement: string): void
    fixLayerConfigs?(): void
  }
}
