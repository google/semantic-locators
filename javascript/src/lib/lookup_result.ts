/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {getNameFor} from './accessible_name';
import {computeARIAAttributeValue} from './attribute';
import {getRole} from './role';
import {AriaRole} from './role_map';
import {Attribute, SemanticLocator, SemanticNode} from './semantic_locator';
import {compareNodeOrder, removeDuplicates} from './util';

/**
 * Either some HTMLElements which have been found, or metadata about why none
 * were found.
 */
export type Result = EmptyResultsMetadata|NonEmptyResult;

/** Details about why a semantic locator didn't resolve to any elements. */
export interface EmptyResultsMetadata {
  // The longest array of nodes which successfully resolved to an element. An
  // array of `SemanticNodes` rather than a `SemanticLocator` as `outer` doesn't
  // make a difference when no elements are found
  readonly closestFind: readonly SemanticNode[];
  // Partial node which was resolved after `closestFind`
  readonly partialFind?: Partial<SemanticNode>;
  // Elements found by `closestFind` + `partialFind`
  readonly elementsFound: readonly HTMLElement[];
  // Condition which no further elements satisfied
  readonly notFound: NodeField;
}

/**
 * Elements found by a semantic loctor. `found` will contain at least one
 * element.
 */
export interface NonEmptyResult {
  readonly found: readonly HTMLElement[];
}

/** Type guard for EmptyResultsMetadata. */
export function isEmptyResultsMetadata(result: Result):
    result is EmptyResultsMetadata {
  return (result as EmptyResultsMetadata).elementsFound !== undefined;
}

/** Type guard for NonEmptyResult. */
export function isNonEmptyResult(result: Result): result is NonEmptyResult {
  return (result as NonEmptyResult).found !== undefined;
}

interface RoleField {
  readonly role: AriaRole;
}

function isRoleField(field: NodeField): field is RoleField {
  return (field as RoleField).role !== undefined;
}

interface AttributeField {
  readonly attribute: Attribute;
}

function isAttributeField(field: NodeField): field is AttributeField {
  return (field as AttributeField).attribute !== undefined;
}

interface NameField {
  readonly name: string;
}

type NodeField = RoleField|AttributeField|NameField;

/**
 * Returns a string explaining why no elements resolved for `locator` based on
 * the info in `metadata`.
 */
export function buildFailureMessage(
    locator: SemanticLocator,
    metadata: EmptyResultsMetadata,
    hiddenElements: readonly HTMLElement[],
    presentationalElements: readonly HTMLElement[],
    ): string {
  let result =
      `Didn't find any elements matching semantic locator ${locator}. `;

  const {elementsFound, partialFind, notFound, closestFind} = metadata;

  const plural = elementsFound.length > 1;
  if (closestFind.length === 0) {
    if (partialFind === undefined) {
      result += `No elements have ${explainNodeField(notFound)}.`;
    } else {
      result += `${elementsFound.length} element${plural ? 's' : ''} ` +
          `with ${explainPartialNode(partialFind)} were found. `;
      result += `However ${plural ? 'none had' : 'it didn\'t have'} ` +
          `${explainNodeField(notFound)}. ` +
          `${valuesForNearMisses(notFound, elementsFound)}.`;
    }
  } else {
    if (partialFind === undefined) {
      result += `${elementsFound.length} element${plural ? 's' : ''} ` +
          `matched the locator ${closestFind.join(' ')}, ` +
          `but ${plural ? 'none had' : 'it didn\'t have'} a descendant with ` +
          `${explainNodeField(notFound)}.`;
    } else {
      result += `${elementsFound.length} descendant${plural ? 's' : ''} ` +
          `of ${closestFind.join(' ')} with ${
                    explainPartialNode(partialFind)} ` +
          `were found. `;
      result += `However ${plural ? 'none had' : 'it didn\'t have'} ` +
          `${explainNodeField(notFound)}. ` +
          `${valuesForNearMisses(notFound, elementsFound)}.`;
    }
  }

  if (hiddenElements.length > 0) {
    const hiddenPlural = hiddenElements.length > 1;
    result += ` ${hiddenElements.length} hidden ` +
        `element${hiddenPlural ? 's' : ''} matched the locator. To match ` +
        `these elements, ensure they're not hidden (aria-hidden is false ` +
        `and they're not hidden by css).`;
  }

  if (presentationalElements.length > 0) {
    const presentationalPlural = presentationalElements.length > 1;
    result += ` ${presentationalElements.length} ` +
        `element${presentationalPlural ? 's' : ''} would have matched the ` +
        `locator, but ${presentationalPlural ? 'have' : 'it has'} an ` +
        `ancestor with presentational children ` +
        `(https://www.w3.org/TR/wai-aria-practices/#children_presentational), ` +
        `erasing its semantics.`;
  }

  return result;
}

function explainNodeField(field: NodeField): string {
  if (isRoleField(field)) {
    return `an ARIA role of ${field.role}`;
  }
  if (isAttributeField(field)) {
    return `aria-${field.attribute.name} = ${field.attribute.value}`;
  }
  return `an accessible name of "${field.name}"`;
}

function explainPartialNode(node: Partial<SemanticNode>): string {
  let result: string[] = [];
  if (node.role) {
    result.push(explainNodeField({role: node.role}));
  }
  if (node.attributes) {
    result = result.concat(
        node.attributes.map(attr => explainNodeField({attribute: attr})));
  }
  if (node.name) {
    result.push(explainNodeField({name: node.name}));
  }

  if (result.length <= 1) {
    return result[0] ?? '';
  }
  return result.slice(0, result.length - 1).join(', ') +
      `, and ${result[result.length - 1]}`;
}

/**
 * Evaluates `condition` for each element in `nearMisses` and returns a string
 * describing their value.
 */
function valuesForNearMisses(
    field: NodeField, nearMisses: readonly HTMLElement[]): string {
  if (isRoleField(field)) {
    const roles =
        nearMisses.map(element => getRole(element)).filter(r => r != null);
    return `Roles found: ${JSON.stringify(Array.from(new Set(roles)))}`;
  }
  if (isAttributeField(field)) {
    const values = nearMisses.map(
        element => computeARIAAttributeValue(element, field.attribute.name));
    return `Values found for aria-${field.attribute.name}: ${
        JSON.stringify(Array.from(new Set(values)))}`;
  }

  const names = nearMisses.map(getNameFor).filter(name => name !== '');
  if (names.length === 0) {
    return 'No matching elements had an accessible name';
  }
  return `Accessible names found: ${
      JSON.stringify(Array.from(new Set(names)))}`;
}

/**
 * Combine metadata for the cases where we got the "furthest" in the search &
 * got closest to finding a result
 */
export function combineMostSpecific(metadatas: readonly EmptyResultsMetadata[]):
    EmptyResultsMetadata {
  const specificities = metadatas.map(emptyResultSpecificity);
  const maxSpecificty = Math.max(...specificities);
  const closest =
      metadatas.filter((m, i) => specificities[i] === maxSpecificty);

  return {
    elementsFound: removeDuplicates(
        closest.flatMap(el => el.elementsFound).sort(compareNodeOrder)),
    closestFind: closest[0].closestFind,
    partialFind: closest[0].partialFind,
    notFound: closest[0].notFound,
  };
}

/**
 * A measure of how far through the search we got before fialing to find an
 * element. Higher is more specific.
 */
function partialNodeSpecificity(node: Partial<SemanticNode>): number {
  let count = 0;
  if (node.role !== undefined) {
    count++;
  }
  if (node.attributes !== undefined) {
    count += node.attributes.length;
  }
  if (node.name !== undefined) {
    count++;
  }
  return count;
}

/**
 * A measure of how far through the search we got before fialing to find an
 * element. Higher is more specific.
 */
function emptyResultSpecificity(metadata: EmptyResultsMetadata): number {
  // Assume there will never be more than 50 things in a partial find.
  return metadata.closestFind.length +
      (partialNodeSpecificity(metadata.partialFind ?? {}) / 50);
}
