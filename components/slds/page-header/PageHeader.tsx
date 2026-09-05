import type * as React from "react";
import type { CarbonIconType } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";
import { Icon } from "@/components/slds/icon";

/**
 * The SLDS 2 Page Header blueprint, base variant.
 *
 * Title, optional figure, optional meta line, optional actions. Not the
 * "object home" or "record home" variants — those are Salesforce record
 * chrome, which is out of scope (D10).
 */
export interface PageHeaderProps {
  title: string;
  /** Small line under the title: a count, a status, a parent. */
  meta?: string;
  icon?: CarbonIconType;
  actions?: React.ReactNode;
  headingLevel?: 1 | 2 | 3;
  className?: ClassValue;
}

export function PageHeader({
  title,
  meta,
  icon,
  actions,
  headingLevel = 1,
  className,
}: PageHeaderProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <div className={cx("slds-page-header", className)}>
      <div className="slds-page-header__row">
        <div className="slds-page-header__col-title">
          <div className="slds-media">
            {icon ? (
              <div className="slds-media__figure">
                <Icon icon={icon} size="small" tone="default" decorative />
              </div>
            ) : null}
            <div className="slds-media__body">
              <div className="slds-page-header__name">
                <div className="slds-page-header__name-title">
                  <Heading className="slds-text-heading_medium">{title}</Heading>
                </div>
              </div>
              {meta ? <p className="slds-page-header__name-meta">{meta}</p> : null}
            </div>
          </div>
        </div>
        {actions ? (
          <div className="slds-page-header__col-actions">
            <div className="slds-page-header__controls">
              <div className="slds-page-header__control site-cluster">{actions}</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
