import React from 'react';

export default function WarRoom() {
    return (
        <div style={{flex: '1', display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 22px', minHeight: '0'}}>

    <div style={{display: 'flex', alignItems: 'flex-end', gap: '14px'}}>
      <div>
        <div className="kicker">Guild war room · REQ-6.1 &ndash; 6.3 · Leader &amp; Officer only</div>
        <div className="sect-t" style={{marginTop: '3px'}}>Ironforge Union &mdash; where to push</div>
      </div>
      <div style={{marginLeft: 'auto', display: 'flex', gap: '8px'}}>
        <div className="pill">Read-only view of M3 + M5</div>
        <div className="pill">Recomputed hourly</div>
      </div>
    </div>

    {/* contested zones */}
    <div className="row" style={{flex: '0 0 auto'}}>
      <div className="panel" style={{flex: '1', borderColor: 'rgba(201,74,74,.45)'}}>
        <div className="panel-b" style={{padding: '12px 14px', gap: '7px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span className="disp" style={{fontSize: '15px'}}>The Nexus</span>
            <span className="pill" style={{borderColor: 'rgba(201,74,74,.45)', color: '#c94a4a'}}>losing by 14%</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '9px'}}>
            <div className="bar" style={{flex: '1'}}><i style={{width: '86%'}}></i></div>
            <span className="mono" style={{fontSize: '11px'}}>2744</span><span className="dim mono" style={{fontSize: '11px'}}>/ 3180</span>
          </div>
          <div className="dim mono" style={{fontSize: '10.5px'}}>leader Nullbyte Syndicate · needs +595 to flip · graphs, dp</div>
        </div>
      </div>
      <div className="panel" style={{flex: '1', borderColor: 'rgba(201,162,39,.45)'}}>
        <div className="panel-b" style={{padding: '12px 14px', gap: '7px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span className="disp" style={{fontSize: '15px'}}>Rivergate</span>
            <span className="pill" style={{borderColor: 'rgba(201,162,39,.5)', color: '#c9a227'}}>held by 5%</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '9px'}}>
            <div className="bar" style={{flex: '1'}}><i style={{width: '100%'}}></i></div>
            <span className="mono" style={{fontSize: '11px'}}>2180</span><span className="dim mono" style={{fontSize: '11px'}}>/ 2061</span>
          </div>
          <div className="dim mono" style={{fontSize: '10.5px'}}>challenger Ironpeak Circle · inside the 5% hysteresis · strings, arrays</div>
        </div>
      </div>
      <div className="panel" style={{flex: '1'}}>
        <div className="panel-b" style={{padding: '12px 14px', gap: '7px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span className="disp" style={{fontSize: '15px'}}>Iron Peaks</span>
            <span className="pill" style={{borderColor: 'rgba(74,201,127,.45)', color: '#4ac97f'}}>safe &mdash; +18%</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '9px'}}>
            <div className="bar" style={{flex: '1'}}><i style={{width: '100%', background: '#4ac97f'}}></i></div>
            <span className="mono" style={{fontSize: '11px'}}>3412</span><span className="dim mono" style={{fontSize: '11px'}}>/ 2904</span>
          </div>
          <div className="dim mono" style={{fontSize: '10.5px'}}>challenger Nullbyte Syndicate · graphs, trees</div>
        </div>
      </div>
    </div>

    <div style={{height: '100%', display: 'flex', gap: '16px', minHeight: '0'}}>
      <div className="panel" style={{flex: '1', minWidth: '0'}}>
        <div className="panel-h">
          <div className="panel-t">Member &times; topic strength</div>
          <span className="dim mono" style={{fontSize: '10.5px'}}>gold cell = feeds a contested zone&rsquo;s top-two topics</span>
          <div style={{marginLeft: 'auto', display: 'flex', gap: '6px'}}>
            <div className="pill">Zone: The Nexus</div><div className="pill">Sort: alignment</div>
          </div>
        </div>
        <div style={{overflow: 'hidden'}}>
          <table className="wt">
            <tr>
              <th>Member</th>
              <th style={{textAlign: 'center'}}>Arr</th><th style={{textAlign: 'center'}}>Str</th><th style={{textAlign: 'center'}}>Math</th>
              <th style={{textAlign: 'center'}}>Grdy</th><th style={{textAlign: 'center'}}>Grph</th><th style={{textAlign: 'center'}}>Tree</th>
              <th style={{textAlign: 'center'}}>DP</th><th style={{textAlign: 'center'}}>DS</th>
              <th>Nexus contribution</th><th>Last sync</th><th style={{width: '74px'}}></th>
            </tr>

            <tr>
              <td><div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><div className="avatar" style={{width: '24px', height: '24px', fontSize: '10px'}}>L</div><span style={{fontSize: '12.5px'}}>lena_kx</span><span className="pill" style={{fontSize: '10px', padding: '1px 6px'}}>Leader</span></div></td>
              <td className="mono" style={{textAlign: 'center'}}>6</td><td className="mono" style={{textAlign: 'center'}}>5</td><td className="mono" style={{textAlign: 'center', background: 'rgba(201,162,39,.14)', color: '#c9a227'}}>6</td>
              <td className="mono" style={{textAlign: 'center'}}>4</td><td className="mono" style={{textAlign: 'center', background: 'rgba(201,162,39,.22)', color: '#c9a227'}}>7</td><td className="mono" style={{textAlign: 'center'}}>4</td>
              <td className="mono" style={{textAlign: 'center', background: 'rgba(201,162,39,.18)', color: '#c9a227'}}>5</td><td className="mono" style={{textAlign: 'center'}}>4</td>
              <td><div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><div className="bar" style={{width: '64px'}}><i style={{width: '100%'}}></i></div><span className="mono dim" style={{fontSize: '11px'}}>642 · 23%</span></div></td>
              <td className="dim mono" style={{fontSize: '11px'}}>18 min</td>
              <td><span className="dim" style={{fontSize: '11.5px'}}>village &rsaquo;</span></td>
            </tr>

            <tr className="me">
              <td><div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><div className="avatar" style={{width: '24px', height: '24px', fontSize: '10px'}}>A</div><span style={{fontSize: '12.5px'}}>ash_solves</span><span className="pill" style={{fontSize: '10px', padding: '1px 6px'}}>Officer</span></div></td>
              <td className="mono" style={{textAlign: 'center'}}>6</td><td className="mono" style={{textAlign: 'center'}}>4</td><td className="mono" style={{textAlign: 'center', background: 'rgba(201,162,39,.14)', color: '#c9a227'}}>5</td>
              <td className="mono" style={{textAlign: 'center'}}>3</td><td className="mono" style={{textAlign: 'center', background: 'rgba(201,162,39,.18)', color: '#c9a227'}}>5</td><td className="mono" style={{textAlign: 'center'}}>4</td>
              <td className="mono" style={{textAlign: 'center', background: 'rgba(201,74,74,.16)', color: '#c94a4a'}}>3</td><td className="mono" style={{textAlign: 'center'}}>4</td>
              <td><div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><div className="bar" style={{width: '64px'}}><i style={{width: '78%'}}></i></div><span className="mono dim" style={{fontSize: '11px'}}>501 · 18%</span></div></td>
              <td className="dim mono" style={{fontSize: '11px'}}>4 min</td>
              <td><span className="dim" style={{fontSize: '11.5px'}}>village &rsaquo;</span></td>
            </tr>

            <tr>
              <td><div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><div className="avatar" style={{width: '24px', height: '24px', fontSize: '10px'}}>S</div><span style={{fontSize: '12.5px'}}>sneha_r</span><span className="pill" style={{fontSize: '10px', padding: '1px 6px'}}>Officer</span></div></td>
              <td className="mono" style={{textAlign: 'center'}}>5</td><td className="mono" style={{textAlign: 'center'}}>5</td><td className="mono" style={{textAlign: 'center', background: 'rgba(201,162,39,.10)', color: '#c9a227'}}>4</td>
              <td className="mono" style={{textAlign: 'center'}}>4</td><td className="mono" style={{textAlign: 'center', background: 'rgba(201,162,39,.22)', color: '#c9a227'}}>7</td><td className="mono" style={{textAlign: 'center'}}>5</td>
              <td className="mono" style={{textAlign: 'center', background: 'rgba(201,162,39,.14)', color: '#c9a227'}}>4</td><td className="mono" style={{textAlign: 'center'}}>3</td>
              <td><div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><div className="bar" style={{width: '64px'}}><i style={{width: '74%'}}></i></div><span className="mono dim" style={{fontSize: '11px'}}>470 · 17%</span></div></td>
              <td className="dim mono" style={{fontSize: '11px'}}>2 h</td>
              <td><span className="dim" style={{fontSize: '11.5px'}}>village &rsaquo;</span></td>
            </tr>

            <tr>
              <td><div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><div className="avatar" style={{width: '24px', height: '24px', fontSize: '10px'}}>K</div><span style={{fontSize: '12.5px'}}>karthik_v</span></div></td>
              <td className="mono" style={{textAlign: 'center'}}>4</td><td className="mono" style={{textAlign: 'center'}}>4</td><td className="mono" style={{textAlign: 'center', background: 'rgba(201,162,39,.10)', color: '#c9a227'}}>4</td>
              <td className="mono" style={{textAlign: 'center'}}>3</td><td className="mono" style={{textAlign: 'center', background: 'rgba(201,74,74,.16)', color: '#c94a4a'}}>2</td><td className="mono" style={{textAlign: 'center'}}>5</td>
              <td className="mono" style={{textAlign: 'center', background: 'rgba(201,162,39,.10)', color: '#c9a227'}}>4</td><td className="mono" style={{textAlign: 'center'}}>4</td>
              <td><div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><div className="bar" style={{width: '64px'}}><i style={{width: '52%'}}></i></div><span className="mono dim" style={{fontSize: '11px'}}>331 · 12%</span></div></td>
              <td className="dim mono" style={{fontSize: '11px'}}>1 d</td>
              <td><span className="dim" style={{fontSize: '11.5px'}}>village &rsaquo;</span></td>
            </tr>

            <tr>
              <td><div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><div className="avatar" style={{width: '24px', height: '24px', fontSize: '10px'}}>D</div><span style={{fontSize: '12.5px'}}>divya_m</span></div></td>
              <td className="mono" style={{textAlign: 'center'}}>4</td><td className="mono" style={{textAlign: 'center'}}>3</td><td className="mono" style={{textAlign: 'center', background: 'rgba(201,162,39,.14)', color: '#c9a227'}}>5</td>
              <td className="mono" style={{textAlign: 'center'}}>3</td><td className="mono" style={{textAlign: 'center', background: 'rgba(201,162,39,.14)', color: '#c9a227'}}>4</td><td className="mono" style={{textAlign: 'center'}}>3</td>
              <td className="mono" style={{textAlign: 'center', background: 'rgba(201,162,39,.10)', color: '#c9a227'}}>4</td><td className="mono" style={{textAlign: 'center'}}>3</td>
              <td><div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><div className="bar" style={{width: '64px'}}><i style={{width: '44%'}}></i></div><span className="mono dim" style={{fontSize: '11px'}}>284 · 10%</span></div></td>
              <td className="dim mono" style={{fontSize: '11px'}}>3 d</td>
              <td><span className="dim" style={{fontSize: '11.5px'}}>village &rsaquo;</span></td>
            </tr>

            <tr>
              <td><div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><div className="avatar" style={{width: '24px', height: '24px', fontSize: '10px'}}>N</div><span className="muted" style={{fontSize: '12.5px'}}>nikhil_p</span></div></td>
              <td className="mono dim" style={{textAlign: 'center'}}>3</td><td className="mono dim" style={{textAlign: 'center'}}>3</td><td className="mono dim" style={{textAlign: 'center'}}>3</td>
              <td className="mono dim" style={{textAlign: 'center'}}>2</td><td className="mono dim" style={{textAlign: 'center'}}>4</td><td className="mono dim" style={{textAlign: 'center'}}>3</td>
              <td className="mono dim" style={{textAlign: 'center'}}>2</td><td className="mono dim" style={{textAlign: 'center'}}>3</td>
              <td><div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><div className="bar" style={{width: '64px'}}><i style={{width: '19%', background: '#c94a4a'}}></i></div><span className="mono bad" style={{fontSize: '11px'}}>122 · decayed 0.50</span></div></td>
              <td className="bad mono" style={{fontSize: '11px'}}>26 d</td>
              <td><span className="dim" style={{fontSize: '11.5px'}}>village &rsaquo;</span></td>
            </tr>

            <tr>
              <td><div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><div className="avatar" style={{width: '24px', height: '24px', fontSize: '10px'}}>T</div><span style={{fontSize: '12.5px'}}>tanvi_s</span></div></td>
              <td className="mono" style={{textAlign: 'center'}}>3</td><td className="mono" style={{textAlign: 'center'}}>4</td><td className="mono" style={{textAlign: 'center', background: 'rgba(201,74,74,.16)', color: '#c94a4a'}}>2</td>
              <td className="mono" style={{textAlign: 'center'}}>3</td><td className="mono" style={{textAlign: 'center', background: 'rgba(201,74,74,.16)', color: '#c94a4a'}}>2</td><td className="mono" style={{textAlign: 'center'}}>3</td>
              <td className="mono" style={{textAlign: 'center', background: 'rgba(201,74,74,.16)', color: '#c94a4a'}}>2</td><td className="mono" style={{textAlign: 'center'}}>3</td>
              <td><div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><div className="bar" style={{width: '64px'}}><i style={{width: '26%'}}></i></div><span className="mono dim" style={{fontSize: '11px'}}>168 · 6%</span></div></td>
              <td className="dim mono" style={{fontSize: '11px'}}>5 h</td>
              <td><span className="dim" style={{fontSize: '11.5px'}}>village &rsaquo;</span></td>
            </tr>
          </table>
          <div className="dim mono" style={{fontSize: '10.5px', padding: '11px 14px'}}>11 more members · cells are village levels, not raw solve counts</div>
        </div>
      </div>

      <div className="col" style={{width: '314px', flex: '0 0 314px'}}>
        <div className="panel">
          <div className="panel-h"><div className="panel-t">Where to push</div></div>
          <div className="panel-b" style={{gap: '11px'}}>
            <div className="dim" style={{fontSize: '11px', lineHeight: '1.55'}}>The Nexus rewards graphs (0.30) and DP (0.26). These members are one or two levels from a meaningful swing.</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '9px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '9px'}}>
                <div className="avatar" style={{width: '26px', height: '26px', fontSize: '10px'}}>A</div>
                <div style={{flex: '1'}}><div style={{fontSize: '12px'}}>ash_solves</div><div className="dim mono" style={{fontSize: '10.5px'}}>DP Lv 3 &rarr; 4 = +82 to Nexus</div></div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '9px'}}>
                <div className="avatar" style={{width: '26px', height: '26px', fontSize: '10px'}}>S</div>
                <div style={{flex: '1'}}><div style={{fontSize: '12px'}}>sneha_r</div><div className="dim mono" style={{fontSize: '10.5px'}}>Graphs Lv 7 &rarr; 8 = +96 to Nexus</div></div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '9px'}}>
                <div className="avatar" style={{width: '26px', height: '26px', fontSize: '10px'}}>N</div>
                <div style={{flex: '1'}}><div style={{fontSize: '12px'}}>nikhil_p</div><div className="dim mono" style={{fontSize: '10.5px'}}>one sync lifts decay 0.50 &rarr; 1.00</div></div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel" style={{flex: '1', minHeight: '0'}}>
          <div className="panel-h"><div className="panel-t">Reading this table</div></div>
          <div className="panel-b" style={{gap: '9px'}}>
            <div style={{display: 'flex', gap: '9px', alignItems: 'center'}}><span style={{width: '22px', height: '16px', background: 'rgba(201,162,39,.22)', border: '1px solid rgba(201,162,39,.4)', display: 'block'}}></span><span className="muted" style={{fontSize: '11.5px'}}>Aligns with a contested zone</span></div>
            <div style={{display: 'flex', gap: '9px', alignItems: 'center'}}><span style={{width: '22px', height: '16px', background: 'rgba(201,74,74,.16)', border: '1px solid rgba(201,74,74,.4)', display: 'block'}}></span><span className="muted" style={{fontSize: '11.5px'}}>Gap in a topic the zone needs</span></div>
            <div style={{display: 'flex', gap: '9px', alignItems: 'center'}}><span className="mono bad" style={{width: '22px', fontSize: '11px', textAlign: 'center'}}>26 d</span><span className="muted" style={{fontSize: '11.5px'}}>Inactive &mdash; contribution decays 2% a day to a 50% floor</span></div>
            <div style={{height: '1px', background: '#2a323d', margin: '3px 0'}}></div>
            <div className="dim" style={{fontSize: '11px', lineHeight: '1.55'}}>Plain members get a 403 on this route. Kick and role changes live on the Guild screen, not here &mdash; the war room is read-only by design.</div>
          </div>
        </div>
      </div>
    </div>
  </div>

    );
}
