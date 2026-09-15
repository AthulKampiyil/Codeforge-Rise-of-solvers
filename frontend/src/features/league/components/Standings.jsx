import React from 'react';

export default function Standings() {
    return (
        <div style={{flex: '1', display: 'flex', gap: '16px', padding: '18px 22px', minHeight: '0'}}>
    <div className="col" style={{flex: '1', minWidth: '0'}}>

      <div style={{display: 'flex', alignItems: 'flex-end', gap: '16px'}}>
        <div>
          <div className="kicker">League &amp; trophies · REQ-7.4, REQ-7.5</div>
          <div className="sect-t" style={{marginTop: '3px', fontSize: '23px'}}>Season III Standings</div>
        </div>
        <div style={{display: 'flex', gap: '0', marginLeft: 'auto', border: '1px solid #2a323d', borderRadius: '4px', overflow: 'hidden'}}>
          <span style={{padding: '7px 16px', fontSize: '12px', background: '#c9a227', color: '#14100a', fontWeight: '600'}}>Global</span>
          <span style={{padding: '7px 16px', fontSize: '12px', color: '#8b96a5'}}>My guild</span>
          <span style={{padding: '7px 16px', fontSize: '12px', color: '#8b96a5'}}>Gold tier</span>
        </div>
        <div className="pill">Cached 60 s</div>
      </div>

      {/* podium */}
      <div className="row" style={{flex: '0 0 auto', alignItems: 'flex-end'}}>
        <div className="panel" style={{flex: '1'}}>
          <div className="panel-b" style={{padding: '16px', gap: '9px', alignItems: 'center'}}>
            <div className="mono dim" style={{fontSize: '11px'}}>02</div>
            <div className="avatar" style={{width: '46px', height: '46px', fontSize: '18px'}}>V</div>
            <div className="disp" style={{fontSize: '16px'}}>vikram_ns</div>
            <div className="dim mono" style={{fontSize: '11px'}}>Nullbyte Syndicate</div>
            <div className="mono" style={{fontSize: '22px'}}>3412</div>
            <div className="pill" style={{color: '#4a90c9', borderColor: 'rgba(74,144,201,.5)'}}>Legend</div>
          </div>
        </div>
        <div className="panel" style={{flex: '1.16', borderColor: '#c9a227', background: 'linear-gradient(180deg, rgba(201,162,39,.09), #141a22 60%)'}}>
          <div className="panel-b" style={{padding: '20px 16px', gap: '10px', alignItems: 'center'}}>
            <div className="mono gold" style={{fontSize: '12px', letterSpacing: '.2em'}}>01</div>
            <div className="avatar" style={{width: '58px', height: '58px', fontSize: '22px', borderColor: '#c9a227'}}>H</div>
            <div className="disp" style={{fontSize: '19px'}}>hemant_ai</div>
            <div className="dim mono" style={{fontSize: '11px'}}>Ironpeak Circle</div>
            <div className="mono gold" style={{fontSize: '28px'}}>3688</div>
            <div className="pill" style={{color: '#c9a227', borderColor: '#c9a227'}}>Legend · 41 zones fed</div>
          </div>
        </div>
        <div className="panel" style={{flex: '1'}}>
          <div className="panel-b" style={{padding: '16px', gap: '9px', alignItems: 'center'}}>
            <div className="mono dim" style={{fontSize: '11px'}}>03</div>
            <div className="avatar" style={{width: '46px', height: '46px', fontSize: '18px'}}>P</div>
            <div className="disp" style={{fontSize: '16px'}}>priya_dl</div>
            <div className="dim mono" style={{fontSize: '11px'}}>Verdant Order</div>
            <div className="mono" style={{fontSize: '22px'}}>3140</div>
            <div className="pill" style={{color: '#4a90c9', borderColor: 'rgba(74,144,201,.5)'}}>Legend</div>
          </div>
        </div>
      </div>

      <div className="panel" style={{flex: '1', minHeight: '0'}}>
        <div className="panel-h">
          <div className="panel-t">Ranking</div>
          <span className="dim mono" style={{fontSize: '10.5px'}}>keyset paging on (trophy_count DESC, user_id)</span>
          <span className="dim" style={{marginLeft: 'auto', fontSize: '11.5px'}}>Jump to my rank &rsaquo;</span>
        </div>
        <div style={{overflow: 'hidden'}}>
          <table className="wt">
            <tr><th style={{width: '56px'}}>Rank</th><th>Solver</th><th>Guild</th><th>Tier</th><th>Trophies</th><th>Defense</th><th>Attacks won</th><th>Change</th></tr>
            <tr><td className="mono dim">4</td><td style={{fontSize: '12.5px'}}>aditi_rn</td><td className="dim" style={{fontSize: '12px'}}>Nullbyte Syndicate</td><td><span className="pill" style={{color: '#4a90c9', borderColor: 'rgba(74,144,201,.5)'}}>Diamond</span></td><td className="mono">2914</td><td className="mono dim">1702</td><td className="mono dim">118</td><td className="mono ok" style={{fontSize: '11.5px'}}>&#9650; 2</td></tr>
            <tr><td className="mono dim">5</td><td style={{fontSize: '12.5px'}}>soham_gk</td><td className="dim" style={{fontSize: '12px'}}>Ironforge Union</td><td><span className="pill" style={{color: '#4a90c9', borderColor: 'rgba(74,144,201,.5)'}}>Diamond</span></td><td className="mono">2760</td><td className="mono dim">1688</td><td className="mono dim">104</td><td className="mono bad" style={{fontSize: '11.5px'}}>&#9660; 1</td></tr>
            <tr><td className="mono dim">6</td><td style={{fontSize: '12.5px'}}>nadia_ff</td><td className="dim" style={{fontSize: '12px'}}>Verdant Order</td><td><span className="pill" style={{color: '#4a90c9', borderColor: 'rgba(74,144,201,.5)'}}>Diamond</span></td><td className="mono">2588</td><td className="mono dim">1640</td><td className="mono dim">97</td><td className="mono dim" style={{fontSize: '11.5px'}}>&mdash;</td></tr>
            <tr><td className="mono dim">7</td><td style={{fontSize: '12.5px'}}>marco_ll</td><td className="dim" style={{fontSize: '12px'}}>Nullbyte Syndicate</td><td><span className="pill">Platinum</span></td><td className="mono">2104</td><td className="mono dim">1364</td><td className="mono dim">73</td><td className="mono ok" style={{fontSize: '11.5px'}}>&#9650; 4</td></tr>
            <tr><td className="mono dim">8</td><td style={{fontSize: '12.5px'}}>lena_kx</td><td className="dim" style={{fontSize: '12px'}}>Ironforge Union</td><td><span className="pill">Platinum</span></td><td className="mono">1608</td><td className="mono dim">1451</td><td className="mono dim">52</td><td className="mono ok" style={{fontSize: '11.5px'}}>&#9650; 1</td></tr>
            <tr><td className="mono dim">&hellip;</td><td className="dim" colspan="7" style={{fontSize: '11.5px'}}>200 rows between here and your position</td></tr>
            <tr className="me">
              <td className="mono gold">212</td>
              <td><div style={{display: 'flex', alignItems: 'center', gap: '9px'}}><div className="avatar" style={{width: '24px', height: '24px', fontSize: '10px'}}>A</div><span style={{fontSize: '12.5px'}}>ash_solves <span className="dim">(you)</span></span></div></td>
              <td className="dim" style={{fontSize: '12px'}}>Ironforge Union</td>
              <td><span className="pill" style={{color: '#c9a227', borderColor: 'rgba(201,162,39,.5)'}}>Gold</span></td>
              <td className="mono gold">1428</td><td className="mono dim">1342</td><td className="mono dim">27</td>
              <td className="mono ok" style={{fontSize: '11.5px'}}>&#9650; 9</td>
            </tr>
            <tr><td className="mono dim">213</td><td style={{fontSize: '12.5px'}}>rin_kohaku</td><td className="dim" style={{fontSize: '12px'}}>Ironpeak Circle</td><td><span className="pill" style={{color: '#c9a227', borderColor: 'rgba(201,162,39,.5)'}}>Gold</span></td><td className="mono">1421</td><td className="mono dim">1387</td><td className="mono dim">31</td><td className="mono bad" style={{fontSize: '11.5px'}}>&#9660; 3</td></tr>
            <tr><td className="mono dim">214</td><td style={{fontSize: '12.5px'}}>sneha_r</td><td className="dim" style={{fontSize: '12px'}}>Ironforge Union</td><td><span className="pill" style={{color: '#c9a227', borderColor: 'rgba(201,162,39,.5)'}}>Gold</span></td><td className="mono">1355</td><td className="mono dim">1402</td><td className="mono dim">37</td><td className="mono dim" style={{fontSize: '11.5px'}}>&mdash;</td></tr>
            <tr><td className="mono dim">215</td><td style={{fontSize: '12.5px'}}>karthik_v</td><td className="dim" style={{fontSize: '12px'}}>Ironforge Union</td><td><span className="pill" style={{color: '#c9a227', borderColor: 'rgba(201,162,39,.5)'}}>Gold</span></td><td className="mono">1240</td><td className="mono dim">1298</td><td className="mono dim">29</td><td className="mono ok" style={{fontSize: '11.5px'}}>&#9650; 2</td></tr>
          </table>
        </div>
      </div>
    </div>

    <div className="col" style={{width: '320px', flex: '0 0 320px'}}>
      <div className="panel">
        <div className="panel-h"><div className="panel-t">Your standing</div></div>
        <div className="panel-b" style={{gap: '12px'}}>
          <div style={{display: 'flex', alignItems: 'baseline', gap: '9px'}}>
            <span className="mono gold" style={{fontSize: '32px'}}>1428</span>
            <span className="muted" style={{fontSize: '12.5px'}}>trophies</span>
            <span className="mono dim" style={{marginLeft: 'auto', fontSize: '12px'}}>rank 212</span>
          </div>
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
              <span className="gold" style={{fontSize: '12px'}}>Gold</span><span className="dim" style={{fontSize: '12px'}}>Platinum at 1500</span>
            </div>
            <div className="bar" style={{height: '8px'}}><i style={{width: '73%'}}></i></div>
            <div className="dim mono" style={{fontSize: '10.5px', marginTop: '5px'}}>72 trophies to promotion · K-factor 32</div>
          </div>
          <div style={{height: '1px', background: '#2a323d'}}></div>
          <div className="kicker">Tier ladder</div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '11.5px'}}><span className="dim">Legend</span><span className="mono dim">3000 +</span></div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '11.5px'}}><span className="dim">Diamond</span><span className="mono dim">2200 &ndash; 2999</span></div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '11.5px'}}><span className="dim">Platinum</span><span className="mono dim">1500 &ndash; 2199</span></div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', padding: '4px 7px', margin: '0 -7px', background: 'rgba(201,162,39,.09)', borderRadius: '3px'}}><span className="gold">Gold</span><span className="mono gold">1000 &ndash; 1499</span></div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '11.5px'}}><span className="dim">Silver</span><span className="mono dim">600 &ndash; 999</span></div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '11.5px'}}><span className="dim">Bronze</span><span className="mono dim">0 &ndash; 599</span></div>
          </div>
          <div className="dim" style={{fontSize: '10.5px', lineHeight: '1.5'}}>[THRESHOLDS ARE PLACEHOLDER] &mdash; they are read from game_balance_config, and an admin can retune them live.</div>
        </div>
      </div>

      <div className="panel" style={{flex: '1', minHeight: '0'}}>
        <div className="panel-h"><div className="panel-t">Trophy ledger</div><span className="dim mono" style={{marginLeft: 'auto', fontSize: '10px'}}>append-only</span></div>
        <div className="panel-b" style={{padding: '0'}}>
          <div style={{padding: '10px 14px', borderBottom: '1px solid rgba(42,50,61,.5)', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span className="mono ok" style={{width: '34px'}}>+11</span>
            <div style={{flex: '1'}}><div style={{fontSize: '12px'}}>Raid won vs pratik_dev</div><div className="dim mono" style={{fontSize: '10px'}}>attack_resolved · 2 h ago</div></div>
          </div>
          <div style={{padding: '10px 14px', borderBottom: '1px solid rgba(42,50,61,.5)', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span className="mono bad" style={{width: '34px'}}>&minus;9</span>
            <div style={{flex: '1'}}><div style={{fontSize: '12px'}}>Raid lost vs lena_kx</div><div className="dim mono" style={{fontSize: '10px'}}>attack_resolved · 1 d ago</div></div>
          </div>
          <div style={{padding: '10px 14px', borderBottom: '1px solid rgba(42,50,61,.5)', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span className="mono ok" style={{width: '34px'}}>+6</span>
            <div style={{flex: '1'}}><div style={{fontSize: '12px'}}>Defence held vs t_okabe</div><div className="dim mono" style={{fontSize: '10px'}}>defense_success · 2 d ago</div></div>
          </div>
          <div style={{padding: '10px 14px', borderBottom: '1px solid rgba(42,50,61,.5)', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span className="mono bad" style={{width: '34px'}}>&minus;5</span>
            <div style={{flex: '1'}}><div style={{fontSize: '12px'}}>Raid abandoned</div><div className="dim mono" style={{fontSize: '10px'}}>abandon_penalty · 3 d ago</div></div>
          </div>
          <div style={{padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span className="mono gold" style={{width: '34px'}}>&#9650;</span>
            <div style={{flex: '1'}}><div style={{fontSize: '12px'}}>Promoted Silver &rarr; Gold</div><div className="dim mono" style={{fontSize: '10px'}}>tier_change · 11 d ago</div></div>
          </div>
        </div>
      </div>
    </div>
  </div>

    );
}
