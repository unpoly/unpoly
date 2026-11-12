/**
Options for the warning that up.migrate.renamedProperty() and up.migrate.removedProperty() print.
@internal
*/
export type PropertyWarningOptions = {
  label?: string
  warning?: string
}

/**
Where to look for an old attribute: a selector, or a function that returns one.
@internal
*/
export type AttributeScope = string | (() => string)

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
    config: import('../../unpoly/util/config.js').ConfigWith<MigrateConfig>
    deprecated(deprecatedExpression: string, replacementExpression: string): void
    renamedNamespace(oldName: string, newName: string): void
    renamedProperty(object: object, oldKey: string, newKey: string, options?: PropertyWarningOptions): void
    removedProperty(object: object, key: string, options?: PropertyWarningOptions & { value?: any }): [any]
    defineThrowingProps(object: object, forbiddenPrototype: object, errorMessage: string): void
    transformAttribute(oldAttr: string, ...args: any[]): void
    renamedAttribute(oldAttr: string, newAttr: string, options?: { scope?: AttributeScope, mapValue?: string | ((value: string) => string) }): void
    removedAttribute(oldAttr: string, options?: { scope?: AttributeScope, replacement?: string }): void
    renamedEvent(oldType: string, newType: string): void
    removedEvent(type: string, replacementExpression?: string | null): void
    fixKey(object: object, oldKey: string, newKey: string, options?: { label?: string, detail?: any }): void
    warn(message: string, ...args: any[]): void
    // Added by other files of unpoly-migrate.
    targetMacro?(queryAttr: string, fixedResultAttrs: Record<string, string>, replacement: string): void
    fixLayerConfigs?(): void
  }
}
