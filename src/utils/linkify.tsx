/**
 * Linkify - Utility to convert URLs in text to clickable links
 *
 * Feature: Make links in messages clickable
 * Supports: http, https, and www links
 */

import React from "react";

/**
 * URL pattern that matches:
 * - http:// and https:// URLs
 * - www. URLs (will be prefixed with https://)
 * - Common domains without protocol
 */
const URL_REGEX =
  /(\b(?:https?:\/\/|www\.)[^\s<>[\]{}|\\^`"']+(?:\([^\s()]*\)|[^\s.,;:!?'")\]}<>])?)/gi;

/**
 * Check if a string contains clickable links
 */
export function containsLinks(text: string): boolean {
  return URL_REGEX.test(text);
}

/**
 * Normalize URL to ensure it has a protocol
 */
function normalizeUrl(url: string): string {
  if (url.startsWith("www.")) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Truncate URL for display (keep domain + first part of path)
 */
function truncateUrl(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) return url;

  try {
    const urlObj = new URL(normalizeUrl(url));
    const domain = urlObj.hostname;
    const path = urlObj.pathname + urlObj.search;

    if (domain.length >= maxLength) {
      return domain.substring(0, maxLength - 3) + "...";
    }

    const remainingLength = maxLength - domain.length - 3;
    if (path.length > remainingLength && remainingLength > 0) {
      return domain + path.substring(0, remainingLength) + "...";
    }

    return domain + path;
  } catch {
    // Fallback for invalid URLs
    return url.substring(0, maxLength - 3) + "...";
  }
}

export interface LinkifyOptions {
  /**
   * Additional className for links
   */
  linkClassName?: string;

  /**
   * Whether to truncate long URLs for display
   * @default true
   */
  truncate?: boolean;

  /**
   * Max length for truncated URLs
   * @default 50
   */
  maxUrlLength?: number;

  /**
   * Whether to open links in new tab
   * @default true
   */
  openInNewTab?: boolean;
}

/**
 * Convert text with URLs to React elements with clickable links
 *
 * @param text - Text that may contain URLs
 * @param options - Configuration options
 * @returns Array of React elements (strings and anchor elements)
 *
 * @example
 * renderWithLinks("Check out https://example.com for more info")
 * // Returns: ["Check out ", <a href="https://example.com">example.com</a>, " for more info"]
 */
export function renderWithLinks(
  text: string,
  options: LinkifyOptions = {},
): React.ReactNode[] {
  const {
    linkClassName = "text-blue-600 hover:text-blue-800 underline hover:no-underline",
    truncate = true,
    maxUrlLength = 50,
    openInNewTab = true,
  } = options;

  if (!text) return [];

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const url = match[0];
    const normalizedUrl = normalizeUrl(url);
    const displayUrl = truncate ? truncateUrl(url, maxUrlLength) : url;

    // Add the link
    parts.push(
      <a
        key={`link-${match.index}`}
        href={normalizedUrl}
        className={linkClassName}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {displayUrl}
      </a>,
    );

    lastIndex = match.index + url.length;
  }

  // Add remaining text after last URL
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  // If no links found, return original text
  if (parts.length === 0) {
    return [text];
  }

  return parts;
}

/**
 * Wrapper component that renders text with clickable links
 */
export interface LinkifyProps {
  children: string;
  className?: string;
  linkClassName?: string;
  truncate?: boolean;
  maxUrlLength?: number;
  openInNewTab?: boolean;
}

export const Linkify: React.FC<LinkifyProps> = ({
  children,
  className,
  linkClassName,
  truncate = true,
  maxUrlLength = 50,
  openInNewTab = true,
}) => {
  const elements = renderWithLinks(children, {
    linkClassName,
    truncate,
    maxUrlLength,
    openInNewTab,
  });

  return <span className={className}>{elements}</span>;
};

export default Linkify;
