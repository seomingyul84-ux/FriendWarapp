// client/MainUI.js
import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from "firebase/database";

const MainUI = ({ playerId }) => {
  const [provinces, setProvinces] = useState([]);
  const db = getDatabase();

  useEffect(() => {
    onValue(ref(db, 'provinces'), (snapshot) => {
      const data = snapshot.val();
      setProvinces(data ? Object.values(data) : []);
    });
  }, [db]);

  // 지형 및 점령 상태에 따른 색상 결정
  const getProvinceStyle = (province) => {
    // 1. 기본 색상 설정 (짙은 초록 vs 연두)
    let backgroundColor = '#90EE90'; // 기본 연두색
    if (province.type === 'MOUNTAIN') backgroundColor = '#006400'; // 산악 짙은 초록
    
    // 2. 광물 지대인데 아직 내 땅이 아니면 일반 땅 색으로 위장
    if (province.type === 'MINERAL' && province.owner !== playerId) {
      backgroundColor = '#90EE90'; 
    } else if (province.type === 'MINERAL' && province.owner === playerId) {
      backgroundColor = '#A9A9A9'; // 내가 먹으면 회색(광물)으로 정체 드러남
    }

    // 3. 점령 중인 유저 표시 (테두리 색상으로 구분)
    let borderColor = '#fff'; // 중립은 흰색 테두리
    if (province.owner === playerId) borderColor = '#0000FF'; // 내 땅 파란 테두리
    if (province.owner === 'FriendA') borderColor = '#FF0000'; // 친구A 빨간 테두리

    return {
      background: backgroundColor,
      border: `4px solid ${borderColor}`,
    };
  };

  return (
    <div style={{ background: '#222', minHeight: '100vh', color: '#fff', padding: '20px' }}>
      <h2>🌍 전역 전략 지도</h2>
      <div style={{ position: 'relative', width: '800px', height: '600px', background: '#333', borderRadius: '10px' }}>
        {provinces.map(p => (
          <div 
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.pos.x}px`,
              top: `${p.pos.y}px`,
              width: '60px',
              height: '60px',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              transition: 'all 0.3s',
              ...getProvinceStyle(p)
            }}
          >
            <strong>{p.name}</strong>
            <span>{p.type === 'MOUNTAIN' ? '⛰️' : ''}</span>
            {/* 내가 점령한 광물지대만 표시 */}
            {p.type === 'MINERAL' && p.owner === playerId && <span>💎</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainUI;;
