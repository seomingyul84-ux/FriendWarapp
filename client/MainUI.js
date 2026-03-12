// client/MainUI.js (가상 구조)

return (
  <View>
    {/* 상단바: 국가 정보 */}
    <Header 
      title={myCountryName} 
      stats={{ money: "$1,200", manpower: "45.2M", date: "1936.05.21" }} 
    />

    {/* 중앙: 실시간 전황 지도 (Node 기반) */}
    <MapContainer>
      {provinces.map(p => (
        <ProvinceNode 
          key={p.id}
          color={p.owner === 'Me' ? 'blue' : p.owner === 'FriendA' ? 'red' : 'gray'}
          onPress={() => openActionMenu(p)}
        />
      ))}
    </MapContainer>

    {/* 하단: 핵심 액션 탭 */}
    <TabNavigator>
      <Tab icon="factory" label="생산" onPress={() => showBuildModal()} />
      <Tab icon="shield" label="군사" onPress={() => showArmyModal()} />
      <Tab icon="handshake" label="외교" onPress={() => showDiplomacyModal()} />
    </TabNavigator>
  </View>
);
