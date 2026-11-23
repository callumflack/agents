"""Guard retirement of visible prompts and compatibility of old review commands."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

OWNER = Path(__file__).resolve().parent
HOOK = OWNER / 'learning_finish.py'
spec = importlib.util.spec_from_file_location('capture_tests', OWNER/'test_capture.py')
fixtures = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixtures)

class FinishTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.homebase = self.root/'homebase'
        self.homebase.mkdir()
        self.corpus = self.homebase/'Learning'
        self.corpus.mkdir()
        self.native = self.root/'native.jsonl'
        self.session = fixtures.SESSION
        self.rows = [
            {'type':'session_meta','payload':{'id':self.session,'cwd':str(self.homebase)}},
            {'type':'event_msg','payload':{'type':'task_started','turn_id':'original-turn'}},
            fixtures.CaptureTests.message('user','Keep upload completion separate from a saved local file.','u1'),
            fixtures.CaptureTests.message('assistant','The file was saved locally; upload completion remains unverified.','a1'),
        ]
        self.write_source()
        self.payload={'hook_event_name':'Stop','session_id':self.session,'turn_id':'original-turn','cwd':str(self.homebase),'transcript_path':str(self.native),'stop_hook_active':False}
    def write_source(self):
        self.native.write_text(''.join(json.dumps(r)+'\n' for r in self.rows))
    def cli(self,*args,payload=None,expected=0):
        command = [sys.executable,str(HOOK),*map(str,args),'--homebase',str(self.homebase)]
        r=subprocess.run(command,input=json.dumps(payload) if payload else None,text=True,capture_output=True)
        self.assertEqual(r.returncode,expected,r.stderr+r.stdout)
        return json.loads(r.stdout) if r.stdout.strip() else None
    def stop(self):
        return self.cli('stop',payload=self.payload)
    def capture(self):
        selection=fixtures.CaptureTests.selection('saved-before-uploaded',self.rows[2]['payload']['content'][0]['text'],self.rows[3]['payload']['content'][0]['text'])
        draft=self.root/'draft.jsonl'; draft.write_text(json.dumps(selection)+'\n')
        r=subprocess.run([sys.executable,str(OWNER/'learning_corpus.py'),'capture','--transcript',str(self.native),'--spec',str(draft),'--data-dir',str(self.corpus)],text=True,capture_output=True)
        self.assertEqual(r.returncode,0,r.stderr)
    def review(self,*args,expected=0):
        return self.cli('review','--transcript',self.native,*args,expected=expected)
    def test_legacy_review_requires_saved_case_and_readable_entry(self):
        self.capture()
        self.review('--disposition','captured','--case-key','saved-before-uploaded',expected=1)
        (self.corpus/'cases.md').write_text('# Cases\n\nCase key: `saved-before-uploaded`.\n')
        self.review('--disposition','captured','--case-key','saved-before-uploaded')
        (self.corpus/'cases.md').write_text('# Cases\n')
        self.review('--disposition','captured','--case-key','saved-before-uploaded',expected=1)

    def test_named_chat_capture_is_valid_but_an_unrelated_old_case_is_not(self):
        self.capture()
        (self.corpus/'cases.md').write_text('Case key: `saved-before-uploaded`.\n')
        other='00000000-0000-4000-8000-000000000002'
        self.rows[0]['payload']['id']=other
        self.rows[2]['payload']['content'][0]['text']=f'Record codex://threads/{self.session}.'
        self.write_source()
        self.review('--disposition','captured','--case-key','saved-before-uploaded')
        self.rows[2]['payload']['content'][0]['text']='Record what we learned in this unrelated task.'
        self.write_source()
        self.review('--disposition','captured','--case-key','saved-before-uploaded',expected=1)

    def test_retired_cached_command_does_not_continue_or_write(self):
        self.native.unlink()
        self.assertEqual(self.stop(),{})
        self.assertEqual(list(self.corpus.iterdir()),[])

    def test_retired_install_does_not_change_other_hooks(self):
        config=self.root/'hooks.json'
        original={'hooks':{'Stop':[{'hooks':[{'type':'command','command':'existing-reviewer'}]}],'UserPromptSubmit':[]}}
        config.write_text(json.dumps(original))
        before=config.read_bytes()
        self.cli('install','--hooks-file',config,expected=1)
        self.assertEqual(config.read_bytes(),before)


if __name__=='__main__': unittest.main()
