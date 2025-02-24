import React, { useEffect, useRef, useCallback, useMemo, ReactElement } from 'react';
import TreeView from 'devextreme-react/tree-view';
import { useNavigation } from '../../contexts/navigation';
import { useScreenSize } from '../../utils/media-query';
import './side-navigation-menu.scss';
import * as events from 'devextreme/events';

interface Props {
  children?: ReactElement | ReactElement[];
  selectedItemChanged: (e: any) => void;
  openMenu: (e: Event) => void;
  compactMode: boolean;
  onMenuReady: () => void;
}

export default function SideNavigationMenu(props: Props): ReactElement {
  const {
    children,
    selectedItemChanged,
    openMenu,
    compactMode,
    onMenuReady
  } = props;

  const { isLarge } = useScreenSize();
  const { navigation, navigationData: { currentPath } } = useNavigation();

  function normalizePath() {
    return navigation.map((item) => {
      if (item.path && !(/^\//.test(item.path))) {
        item.path = `/${item.path}`;
      }
      return { ...item, expanded: isLarge };
    });
  }

  const items = useMemo(
    normalizePath,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigation, isLarge]
  );

  const treeViewRef = useRef<any>();
  const wrapperRef = useRef<HTMLDivElement>();
  const getWrapperRef = useCallback((element: HTMLDivElement) => {
    const prevElement = wrapperRef.current;
    if (prevElement) {
      events.off(prevElement, 'dxclick');
    }

    wrapperRef.current = element;
    if (element) {
      events.on(element, 'dxclick', (e: Event) => {
        openMenu(e);
      });
    }
  }, [openMenu]);

  useEffect(() => {
    const treeView = treeViewRef.current && treeViewRef.current.instance;
    if (!treeView) {
      return;
    }

    if (currentPath !== undefined) {
      treeView.selectItem(currentPath);
      treeView.expandItem(currentPath);
    }

    if (compactMode) {
      treeView.collapseAll();
    }
  }, [currentPath, compactMode]);

  return (
    <div
      ref={getWrapperRef}
      className={'dx-swatch-additional side-navigation-menu'}
    >
      {children}
      <div className={'menu-container'}>
        <TreeView
          ref={treeViewRef}
          items={items}
          keyExpr={'path'}
          selectionMode={'single'}
          focusStateEnabled={false}
          expandEvent={'click'}
          onItemClick={selectedItemChanged}
          onContentReady={onMenuReady}
          width={'100%'}
        />
      </div>
    </div>
  );
}
